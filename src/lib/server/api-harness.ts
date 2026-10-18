/**
 * Test-only: load `api.ts` under node's test runner, against an in-process gRPC
 * server that speaks the real proto.
 *
 * `api.ts` is written for SvelteKit — it imports `$env/dynamic/private` and
 * `$lib/...` and leaves extensions off relative imports — so plain node cannot
 * load it. The module hooks below supply those three things (and Vite's `?raw`
 * import, for the bundled proto), and compile the
 * TypeScript that node's type stripping refuses (client.ts uses parameter
 * properties). That lets the tests exercise the request the UI actually puts
 * on the wire. That is the layer where field-name mistakes hide: protobuf silently
 * drops a field the schema does not know.
 */
import { readFileSync } from 'node:fs';
import { createRequire, registerHooks, stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const LIB = new URL('../', import.meta.url);
const PROTO = fileURLToPath(new URL('../../../proto/priompt/v1/prompt.proto', import.meta.url));

let hooked = false;

/** Import `api.ts` with SvelteKit's aliases resolved. */
export async function loadApi(): Promise<typeof import('./api.ts')> {
	if (!hooked) {
		hooked = true;
		registerHooks({
			resolve(specifier, context, next) {
				if (specifier === '$env/dynamic/private') {
					return { url: 'data:text/javascript,export const env = process.env;', shortCircuit: true };
				}
				if (specifier.startsWith('$lib/')) specifier = new URL(specifier.slice(5), LIB).href;
				if (specifier.endsWith('?raw')) return { url: new URL(specifier, context.parentURL).href, shortCircuit: true };
				try {
					return next(specifier, context);
				} catch (e) {
					if (/^(\.|file:)/.test(specifier) && !/\.[a-z]+$/.test(specifier)) {
						return next(specifier + '.ts', context);
					}
					throw e;
				}
			},
			load(url, context, next) {
				if (url.endsWith('?raw')) {
					const text = readFileSync(fileURLToPath(url.slice(0, -'?raw'.length)), 'utf8');
					return { format: 'module', source: `export default ${JSON.stringify(text)};`, shortCircuit: true };
				}
				if (!url.startsWith('file:') || !url.endsWith('.ts')) return next(url, context);
				const source = stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8'), { mode: 'transform' });
				return { format: 'module', source, shortCircuit: true };
			}
		});
	}
	return import('./api.ts');
}

export interface RecordedCall {
	method: string;
	req: Record<string, unknown>;
}

/** A handler returns the response, or throws `{ code, details }` for a gRPC error. */
export type Handlers = Record<string, (req: Record<string, unknown>) => unknown>;

/**
 * Start a fake PromptService on a free port, point the client at it, and record
 * every request it receives. Methods without a handler answer UNIMPLEMENTED.
 */
export async function fakeServer(handlers: Handlers) {
	const grpc = require('@grpc/grpc-js');
	const loader = require('@grpc/proto-loader');
	const def = loader.loadSync(PROTO, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
	const service = grpc.loadPackageDefinition(def).priompt.v1.PromptService.service;

	const calls: RecordedCall[] = [];
	const impl: Record<string, unknown> = {};
	for (const method of Object.keys(service)) {
		impl[method] = (
			c: { request: Record<string, unknown> },
			cb: (err: unknown, res?: unknown) => void
		) => {
			calls.push({ method, req: c.request });
			const h = handlers[method];
			if (!h) return cb({ code: 12, details: `${method} not implemented by the fake` });
			try {
				cb(null, h(c.request));
			} catch (e) {
				cb(e);
			}
		};
	}

	const api = await loadApi();
	const server = new grpc.Server();
	server.addService(service, impl);
	const port: number = await new Promise((resolve, reject) =>
		server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (e: Error | null, p: number) =>
			e ? reject(e) : resolve(p)
		)
	);
	process.env.PRIOMPT_HOST = `127.0.0.1:${port}`;
	return { api, calls, close: () => server.forceShutdown() };
}
