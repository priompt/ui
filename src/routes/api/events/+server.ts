/**
 * `priompt watch`, as a browser stream.
 *
 * The server pushes a change event over NATS the moment a prompt is republished,
 * carrying the new version hash and the semantic verdict. A browser cannot join
 * a NATS cluster, so this endpoint subscribes on the Node side and relays over
 * Server-Sent Events.
 *
 * The broker credential is separate from the gRPC token — the cluster is its own
 * trust boundary — so it comes from its own variable and, like the gRPC token,
 * never reaches the browser.
 *
 * The event is treated as a notification, not as data: it says *something
 * changed*, and the page re-fetches through the authenticated gRPC path rather
 * than trusting the version and classification in the payload. That is the
 * documented guidance, and it is what keeps a forged event from being actionable.
 */
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

function subject(namespace: string, path: string): string {
	const clean = path.endsWith('.prompt') ? path.slice(0, -'.prompt'.length) : path;
	return clean ? `priompt.${namespace}.${clean.replace(/\//g, '.')}` : `priompt.${namespace}.>`;
}

export const GET: RequestHandler = async ({ url }) => {
	const natsUrl = env.PRIOMPT_NATS_URL;
	if (!natsUrl) throw error(503, 'Live updates are not configured. Set PRIOMPT_NATS_URL.');

	const namespace = url.searchParams.get('namespace') ?? '';
	if (!namespace) throw error(400, 'namespace is required');
	const path = url.searchParams.get('path') ?? '';

	const { connect, StringCodec } = await import('nats');

	// The credential travels in the URL the way every Priompt address does; the
	// nats.js client wants it as an option, so unpack it.
	let servers = natsUrl;
	let token: string | undefined;
	try {
		const u = new URL(natsUrl);
		token = decodeURIComponent(u.password || u.username || '') || undefined;
		u.username = '';
		u.password = '';
		servers = u.toString().replace(/\/$/, '');
	} catch {
		// leave as given
	}

	const nc = await connect(token ? { servers, token } : { servers });
	const sc = StringCodec();
	const sub = nc.subscribe(subject(namespace, path));

	const stream = new ReadableStream({
		async start(controller) {
			const send = (event: string, data: unknown) =>
				controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

			send('ready', { subject: subject(namespace, path) });
			const keepalive = setInterval(() => {
				try {
					controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
				} catch {
					clearInterval(keepalive);
				}
			}, 25_000);

			try {
				for await (const m of sub) {
					let body: { version?: string; classification?: string };
					try {
						body = JSON.parse(sc.decode(m.data));
					} catch {
						body = { version: sc.decode(m.data) };
					}
					send('change', {
						subject: m.subject,
						version: body.version ?? '',
						classification: body.classification ?? ''
					});
				}
			} catch {
				// subscription closed
			} finally {
				clearInterval(keepalive);
				try { controller.close(); } catch { /* already closed */ }
			}
		},
		async cancel() {
			try { await sub.drain(); } catch { /* ignore */ }
			try { await nc.close(); } catch { /* ignore */ }
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-cache, no-transform',
			connection: 'keep-alive'
		}
	});
};
