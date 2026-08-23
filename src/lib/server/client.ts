/**
 * The gRPC client, and the reason it lives under `src/lib/server`.
 *
 * A browser cannot speak gRPC — it is HTTP/2 with protobuf framing, and the
 * fetch API will not produce it. The options are a gRPC-Web proxy (Envoy or
 * grpcwebproxy in front of every deployment) or a server-side layer here in
 * SvelteKit. This is the second: route `load` functions and form actions run on
 * the Node side, call the Priompt server over real gRPC, and hand the browser
 * plain JSON.
 *
 * That choice also keeps the bearer token off the client. The token is an
 * org-scoped write credential; shipping it to the browser would put it in every
 * user's devtools, and Priompt has no per-user authorization below the org, so
 * a leaked token is the whole org. It stays in this process.
 */
import { createRequire } from 'node:module';
import { env } from '$env/dynamic/private';

const require = createRequire(import.meta.url);
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = new URL('../../../proto/priompt/v1/prompt.proto', import.meta.url).pathname;

export interface PriomptConfig {
	host: string;
	token: string;
	tls: boolean;
	/**
	 * The org this deployment is scoped to, when the token is org-scoped.
	 *
	 * A scoped token may not list with an empty prefix — an empty prefix means
	 * "everything", and the server is right to refuse it. But the dashboard
	 * enumerates namespaces by doing exactly that, so without this the UI is
	 * unusable with the credential production is supposed to use. The server has
	 * no "who am I" RPC to ask, so the org is configuration.
	 */
	org: string;
}

/**
 * Resolve connection settings. PRIOMPT_URL carries address and credential in one
 * value (`priompt://<token>@host:port`) — the same variable the Go CLI and both
 * SDKs read, so a deployment configures all of them once. Explicit host/token
 * env vars win over it, matching the precedence the server documents.
 */
export function readConfig(): PriomptConfig | null {
	let host = env.PRIOMPT_HOST ?? '';
	let token = env.PRIOMPT_TOKEN ?? '';
	let tls = env.PRIOMPT_TLS === 'true';
	const org = (env.PRIOMPT_ORG ?? '').trim();

	const url = env.PRIOMPT_URL;
	if (url) {
		const rest = url.startsWith('priompt://') ? url.slice('priompt://'.length) : url;
		const at = rest.lastIndexOf('@');
		if (at >= 0) {
			if (!token) token = rest.slice(0, at);
			if (!host) host = rest.slice(at + 1);
		} else if (!host) {
			host = rest;
		}
	}
	if (!host) return null;
	return { host, token, tls, org };
}

/** Whether a Priompt server is configured. The UI falls back to fixtures if not. */
export function isLive(): boolean {
	return readConfig() !== null;
}

type Stub = Record<string, (req: unknown, meta: unknown, cb: (e: unknown, r: unknown) => void) => void>;

let cached: { stub: Stub; key: string } | null = null;

function stub(): { stub: Stub; meta: unknown } {
	const cfg = readConfig();
	if (!cfg) throw new PriomptError('unconfigured', 'No Priompt server configured.');

	const key = `${cfg.host}|${cfg.tls}`;
	if (!cached || cached.key !== key) {
		const def = protoLoader.loadSync(PROTO_PATH, {
			keepCase: true,
			longs: String,
			enums: String,
			defaults: true,
			oneofs: true
		});
		const pkg = grpc.loadPackageDefinition(def).priompt.v1;
		const creds = cfg.tls
			? grpc.credentials.createSsl()
			: grpc.credentials.createInsecure();
		cached = { stub: new pkg.PromptService(cfg.host, creds), key };
	}
	const meta = new grpc.Metadata();
	if (cfg.token) meta.add('authorization', `Bearer ${cfg.token}`);
	return { stub: cached.stub, meta };
}

/**
 * A gRPC failure translated into something a page can render. The server's
 * status codes are meaningful — ABORTED means the branch moved and the write
 * should be retried, UNAVAILABLE means storage is down — so they are carried
 * through rather than flattened into "something went wrong".
 */
export class PriomptError extends Error {
	constructor(
		readonly code: string,
		message: string
	) {
		super(message);
		this.name = 'PriomptError';
	}

	/** Whether retrying the same request could plausibly succeed. */
	get retryable(): boolean {
		return this.code === 'aborted' || this.code === 'unavailable';
	}
}

const CODE_NAMES: Record<number, string> = {
	3: 'invalid_argument',
	5: 'not_found',
	6: 'already_exists',
	7: 'permission_denied',
	10: 'aborted',
	14: 'unavailable',
	16: 'unauthenticated'
};

export function call<T>(method: string, req: unknown): Promise<T> {
	const { stub: s, meta } = stub();
	return new Promise((resolve, reject) => {
		s[method](req, meta, (err: unknown, res: unknown) => {
			if (err) {
				const e = err as { code?: number; details?: string; message?: string };
				const code = CODE_NAMES[e.code ?? -1] ?? 'internal';
				reject(new PriomptError(code, e.details || e.message || 'request failed'));
			} else {
				resolve(res as T);
			}
		});
	});
}
