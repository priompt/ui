// gRPC bridge to the priompt server. Server-only: browsers can't speak gRPC,
// so every route that needs live data loads through +page.server.ts.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { env } from '$env/dynamic/private';
import type { Branch, Commit, CommitSummary, PromptFile } from '$lib/types';
import { unifiedDiff, worstVerdict } from '$lib/utils/diff';

const require = createRequire(import.meta.url);
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO = join(
	dirname(fileURLToPath(import.meta.url)),
	'../../../proto/priompt/v1/prompt.proto'
);
const ADDR = env.PRIOMPT_ADDR ?? 'localhost:8443';
const TOKEN = env.PRIOMPT_TOKEN ?? '';

// ponytail: one shared insecure channel. Add TLS creds + a per-request channel
// when this stops being a dev-only bridge.
const def = protoLoader.loadSync(PROTO, { keepCase: false, defaults: true });
const pkg = grpc.loadPackageDefinition(def);
const client = new pkg.priompt.v1.PromptService(ADDR, grpc.credentials.createInsecure());

function meta() {
	const m = new grpc.Metadata();
	if (TOKEN) m.set('authorization', `Bearer ${TOKEN}`);
	return m;
}

function call<T>(method: string, req: unknown): Promise<T> {
	return new Promise((resolve, reject) => {
		client[method](req, meta(), (err: Error | null, res: T) =>
			err ? reject(err) : resolve(res)
		);
	});
}

export const rpc = {
	list: (prefix = '') => call<{ entries: { uri: string; versionHash: string }[] }>('ListPrompts', { prefix }),
	get: (uri: string, ref = '') =>
		call<{ template: string; slots: string[]; versionHash: string; commitHash: string }>(
			'GetPrompt',
			{ uri, ref }
		),
	history: (uri: string, branch = '') => call<{ commits: RawCommit[] }>('History', { uri, branch }),
	diffCommits: (uri: string, fromHash: string, toHash: string) =>
		call<{ changes: RawChange[] }>('DiffCommits', { uri, fromHash, toHash }),
	publish: (uri: string, template: string, slots: string[], message: string, branch = '') =>
		call<{ versionHash: string }>('PublishPrompt', { uri, template, slots, message, branch })
};

interface RawCommit {
	hash: string;
	versionHash: string;
	parent: string;
	parent2: string;
	author: string;
	message: string;
	createdAt: string;
}

interface RawChange {
	kind: string;
	classification: string;
	oldStart: number;
	oldEnd: number;
	newStart: number;
	newEnd: number;
	pointDelta: number;
}

// --- URI <-> UI path mapping ------------------------------------------------
// priompt://<namespace>/<path/to/prompt>  <->  /<namespace>/blob/<branch>/<path>

export const uriFor = (namespace: string, path: string) => `priompt://${namespace}/${path}`;

export const splitUri = (uri: string) => {
	const [namespace, ...rest] = uri.replace('priompt://', '').split('/');
	return { namespace, path: rest.join('/') };
};

export function relativeTime(iso: string): string {
	const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
	if (secs < 60) return 'just now';
	const mins = Math.floor(secs / 60);
	if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
	const days = Math.floor(hrs / 24);
	return `${days} day${days === 1 ? '' : 's'} ago`;
}

const toSummary = (c: RawCommit): CommitSummary => ({
	hash: c.hash,
	message: c.message || '(no message)',
	author: c.author || 'unknown',
	date: c.createdAt
});

export const toCommit = (c: RawCommit, files: string[] = []): Commit => ({
	...toSummary(c),
	files,
	semanticVerdict: undefined
});

/** Every prompt URI under a namespace, sorted. */
export async function listPaths(namespace: string): Promise<string[]> {
	const { entries } = await rpc.list(`priompt://${namespace}/`);
	return entries.map((e) => splitUri(e.uri).path).sort();
}

/** Distinct namespaces, with prompt counts, derived from the whole store. */
export async function listNamespaces() {
	const { entries } = await rpc.list('');
	const counts = new Map<string, number>();
	for (const e of entries) {
		const { namespace } = splitUri(e.uri);
		counts.set(namespace, (counts.get(namespace) ?? 0) + 1);
	}
	return [...counts].map(([name, promptCount]) => ({ name, promptCount }));
}

/**
 * One level of the tree at `folderPath`: immediate child folders and prompts.
 * The server stores a flat URI list, so the folder structure is inferred here.
 */
export async function listTree(namespace: string, folderPath: string): Promise<PromptFile[]> {
	const paths = await listPaths(namespace);
	const prefix = folderPath ? `${folderPath}/` : '';
	const folders = new Map<string, number>();
	const files: string[] = [];

	for (const p of paths) {
		if (!p.startsWith(prefix)) continue;
		const rest = p.slice(prefix.length);
		const slash = rest.indexOf('/');
		if (slash === -1) files.push(rest);
		else {
			const dir = rest.slice(0, slash);
			folders.set(dir, (folders.get(dir) ?? 0) + 1);
		}
	}

	// ponytail: one History call per row to get its last commit. Fine at this
	// scale; needs a batched RPC before a namespace with hundreds of prompts.
	const rows: PromptFile[] = [];
	for (const [name, promptCount] of [...folders].sort()) {
		rows.push({
			name,
			path: prefix + name,
			type: 'folder',
			promptCount,
			lastCommit: { hash: '', message: `${promptCount} prompts`, author: '', date: '' },
			updatedAt: ''
		});
	}
	for (const name of files.sort()) {
		const path = prefix + name;
		const last = await lastCommit(namespace, path);
		rows.push({
			name,
			path,
			type: 'file',
			lastCommit: last,
			updatedAt: last.date ? relativeTime(last.date) : ''
		});
	}
	return rows;
}

export async function lastCommit(namespace: string, path: string): Promise<CommitSummary> {
	try {
		const { commits } = await rpc.history(uriFor(namespace, path));
		if (commits.length) return toSummary(commits[0]);
	} catch {
		// a prompt with no history still renders; the row just has no commit
	}
	return { hash: '', message: '', author: '', date: '' };
}

/**
 * Find a commit by hash across the namespace. The route carries only a hash but
 * history is per-prompt, so the owning prompt has to be located first.
 */
export async function findCommit(namespace: string, hash: string) {
	for (const path of await listPaths(namespace)) {
		const uri = uriFor(namespace, path);
		try {
			const { commits } = await rpc.history(uri);
			const found = commits.find((c) => c.hash === hash || c.hash.startsWith(hash));
			if (found) return { path, uri, raw: found };
		} catch {
			// keep looking
		}
	}
	return null;
}

/** A commit plus its rendered diff against its parent and the semantic verdict. */
export async function commitDetail(namespace: string, hash: string): Promise<Commit | null> {
	const hit = await findCommit(namespace, hash);
	if (!hit) return null;

	const { uri, path, raw } = hit;
	const commit = toCommit(raw, [path]);

	if (!raw.parent) {
		const cur = await rpc.get(uri, raw.hash);
		commit.diff = cur.template
			.split('\n')
			.map((l) => '+' + l)
			.join('\n');
		return commit;
	}

	const [before, after, diff] = await Promise.all([
		rpc.get(uri, raw.parent),
		rpc.get(uri, raw.hash),
		rpc.diffCommits(uri, raw.parent, raw.hash)
	]);
	commit.diff = unifiedDiff(before.template, after.template, diff.changes ?? []);
	commit.semanticVerdict = worstVerdict(diff.changes ?? []);
	return commit;
}

/**
 * Branch list for a namespace. The server has no ListBranches RPC and versions
 * are per-prompt, so "main" is all we can honestly report.
 * ponytail: real branch list needs a server-side RPC — see README notes.
 */
export async function listBranches(namespace: string): Promise<Branch[]> {
	const paths = await listPaths(namespace);
	const last = paths.length ? await lastCommit(namespace, paths[0]) : null;
	return [
		{
			name: 'main',
			isDefault: true,
			isServing: true,
			lastCommit: last ?? { hash: '', message: '', author: '', date: '' }
		}
	];
}
