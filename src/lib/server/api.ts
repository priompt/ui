/**
 * Priompt's model mapped onto the UI's.
 *
 * The server stores a flat set of addresses — `priompt://<org>/<free-form path>`
 * — with no repo, folder or namespace object behind them. The UI presents a
 * GitHub-shaped tree. All of that structure is derived here, from the URIs
 * themselves, and nothing about it is persisted server-side:
 *
 *   priompt://acme/support/agent   ->  namespace "acme", folder "support",
 *                                      file "agent.prompt"
 *
 * The `.prompt` suffix is a UI affordance so files look like files; it is never
 * part of the address. Keeping the translation in one module means the rest of
 * the app never hand-rolls a URI, which is what let malformed addresses reach
 * the server in the first place.
 */
import { call, PriomptError } from './client';
import type { Branch, Commit, CommitSummary, Namespace, PromptContent, PromptFile } from '$lib/types';

const SCHEME = 'priompt://';
export const SUFFIX = '.prompt';

// ---------------------------------------------------------------- addresses

export function toURI(namespace: string, path: string): string {
	const clean = path.endsWith(SUFFIX) ? path.slice(0, -SUFFIX.length) : path;
	return `${SCHEME}${namespace}/${clean}`;
}

export function fromURI(uri: string): { namespace: string; path: string } {
	const rest = uri.startsWith(SCHEME) ? uri.slice(SCHEME.length) : uri;
	const slash = rest.indexOf('/');
	if (slash < 0) return { namespace: rest, path: '' };
	return { namespace: rest.slice(0, slash), path: rest.slice(slash + 1) };
}

// ------------------------------------------------------------------- wire

interface WireEntry { uri: string; version_hash: string }
interface WireCommit {
	hash: string; version_hash: string; parent: string; parent2: string;
	author: string; message: string; created_at: string;
}
interface WireWindow { radius: number; delta: number }
export interface WireChange {
	old_start: number; old_end: number; new_start: number; new_end: number;
	kind: string; point_delta: number;
	up: WireWindow[]; down: WireWindow[];
	up_boundary: boolean; down_boundary: boolean;
	classification: string;
}

/**
 * `hash` is abbreviated for display, the way every git UI shows one. `fullHash`
 * is kept beside it because the API needs the whole thing: DiffCommits resolves
 * an exact commit and silently finds nothing for a 7-character prefix, which is
 * how the semantic verdict came back empty the first time this was wired up.
 */
export interface CommitRef extends CommitSummary {
	fullHash: string;
}

function summary(c: WireCommit | undefined): CommitRef {
	if (!c) return { hash: '', fullHash: '', message: '', author: '', date: '' };
	return {
		hash: c.hash.slice(0, 7),
		fullHash: c.hash,
		message: c.message || '(no message)',
		author: c.author || 'unknown',
		date: c.created_at
	};
}

// ------------------------------------------------------------------ reads

/** Every prompt the caller can see. One call; the tree is derived from it. */
export async function listAll(prefix = ''): Promise<WireEntry[]> {
	const res = await call<{ entries: WireEntry[] }>('ListPrompts', { prefix });
	return res.entries ?? [];
}

/**
 * Namespaces are the distinct first path segments — the orgs. A scoped token
 * sees exactly one; an admin token sees every org it has prompts in.
 */
export async function listNamespaces(): Promise<Namespace[]> {
	const entries = await listAll('');
	const counts = new Map<string, number>();
	for (const e of entries) {
		const { namespace } = fromURI(e.uri);
		if (namespace) counts.set(namespace, (counts.get(namespace) ?? 0) + 1);
	}
	return [...counts.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([name, promptCount]) => ({
			id: name,
			name,
			org: name,
			visibility: 'private' as const,
			promptCount,
			updatedAt: '',
			defaultBranch: 'main',
			servingBranch: 'main'
		}));
}

/**
 * One level of the tree. Folders are synthesised from the path segments of the
 * URIs below them, with a count of the prompts they contain.
 */
export async function listTree(namespace: string, folder: string): Promise<PromptFile[]> {
	const prefix = folder ? `${SCHEME}${namespace}/${folder}/` : `${SCHEME}${namespace}/`;
	const entries = await listAll(prefix);

	const folders = new Map<string, number>();
	const files: PromptFile[] = [];
	const base = folder ? `${folder}/` : '';

	for (const e of entries) {
		const { path } = fromURI(e.uri);
		if (!path.startsWith(base)) continue;
		const rel = path.slice(base.length);
		if (!rel) continue;
		const slash = rel.indexOf('/');
		if (slash >= 0) {
			const dir = rel.slice(0, slash);
			folders.set(dir, (folders.get(dir) ?? 0) + 1);
		} else {
			files.push({
				name: rel + SUFFIX,
				path: base + rel + SUFFIX,
				type: 'file',
				lastCommit: { hash: e.version_hash.slice(0, 7), message: '', author: '', date: '' },
				updatedAt: ''
			});
		}
	}

	const dirs: PromptFile[] = [...folders.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([name, promptCount]) => ({
			name,
			path: base + name,
			type: 'folder' as const,
			promptCount,
			lastCommit: { hash: '', message: '', author: '', date: '' },
			updatedAt: ''
		}));

	files.sort((a, b) => a.name.localeCompare(b.name));
	return [...dirs, ...files];
}

/** One prompt at a ref (branch name or commit hash). */
export async function getPrompt(
	namespace: string,
	path: string,
	ref = ''
): Promise<PromptContent> {
	const uri = toURI(namespace, path);
	const res = await call<{
		uri: string; template: string; slots: string[];
		version_hash: string; commit_hash: string;
	}>('GetPrompt', { uri, ref });

	let last: CommitRef = { hash: res.version_hash.slice(0, 7), fullHash: res.version_hash, message: '', author: '', date: '' };
	try {
		const log = await history(namespace, path, ref && !ref.match(/^[0-9a-f]{40,}$/) ? ref : 'main');
		if (log.length) last = log[0];
	} catch {
		// History is a nicety here; a prompt that cannot produce one still renders.
	}

	return {
		path,
		branch: ref || 'main',
		content: res.template,
		slots: res.slots ?? [],
		lastCommit: last
	};
}

export async function history(
	namespace: string,
	path: string,
	branch = 'main'
): Promise<CommitRef[]> {
	const res = await call<{ commits: WireCommit[] }>('History', {
		uri: toURI(namespace, path),
		branch
	});
	return (res.commits ?? []).map(summary);
}

/**
 * The semantic diff between two commits — the verdict the product exists to
 * produce, and which this UI previously did not show anywhere.
 */
export async function diffCommits(
	namespace: string,
	path: string,
	fromHash: string,
	toHash: string
): Promise<WireChange[]> {
	const res = await call<{ changes: WireChange[] }>('DiffCommits', {
		uri: toURI(namespace, path),
		from_hash: fromHash,
		to_hash: toHash
	});
	return res.changes ?? [];
}

/** The semantic diff between what is stored and an unsaved edit. */
export async function diffDraft(
	namespace: string,
	path: string,
	template: string
): Promise<WireChange[]> {
	const res = await call<{ changes: WireChange[] }>('DiffPrompt', {
		uri: toURI(namespace, path),
		template
	});
	return res.changes ?? [];
}

/** The worst verdict across a set of hunks — what a reviewer needs to see. */
export function worstVerdict(changes: WireChange[]): string {
	const rank: Record<string, number> = { 'minor edit': 1, 'localized tweak': 2, structural: 3 };
	let worst = '';
	for (const c of changes) {
		if ((rank[c.classification] ?? 0) > (rank[worst] ?? 0)) worst = c.classification;
	}
	return worst;
}

export async function branches(namespace: string, path: string): Promise<Branch[]> {
	// The API has no "list branches" RPC — branches are per prompt, and a branch
	// is only observable by resolving it. Probe the conventional set and keep the
	// ones that resolve, rather than inventing a server-side concept the contract
	// does not have.
	const names = ['main', 'dev', 'staging', 'prod'];
	const found: Branch[] = [];
	for (const name of names) {
		try {
			const log = await history(namespace, path, name);
			found.push({
				name,
				isDefault: name === 'main',
				isServing: name === 'main',
				lastCommit: log[0] ?? { hash: '', fullHash: '', message: '', author: '', date: '' }
			});
		} catch {
			// not-found means the branch does not exist on this prompt
		}
	}
	return found;
}

// ------------------------------------------------------------------ writes

export async function publish(
	namespace: string,
	path: string,
	template: string,
	slots: string[],
	message: string,
	branch = 'main'
): Promise<string> {
	const res = await call<{ version_hash: string }>('PublishPrompt', {
		uri: toURI(namespace, path),
		template,
		slots,
		message,
		branch
	});
	return res.version_hash;
}

export async function createBranch(
	namespace: string,
	path: string,
	name: string,
	from = 'main'
): Promise<string> {
	const res = await call<{ commit_hash: string }>('CreateBranch', {
		uri: toURI(namespace, path),
		name,
		from
	});
	return res.commit_hash;
}

export async function rollback(
	namespace: string,
	path: string,
	commitHash: string,
	branch = 'main'
): Promise<string> {
	const res = await call<{ version_hash: string }>('SetBranch', {
		uri: toURI(namespace, path),
		branch,
		commit_hash: commitHash
	});
	return res.version_hash;
}


// ------------------------------------------------------- branching & merging

export async function mergeBranch(
	namespace: string,
	path: string,
	into: string,
	from: string,
	message = ''
): Promise<string> {
	const res = await call<{ commit_hash: string }>('MergeBranch', {
		uri: toURI(namespace, path),
		into,
		from,
		message
	});
	return res.commit_hash;
}

/**
 * Promote, as `promptctl promote` means it: move a prompt from one environment
 * branch onto another. The CLI does it in git; over the API it is a merge, with
 * the target branch created first if this prompt has never been promoted there.
 */
export async function promote(
	namespace: string,
	path: string,
	from: string,
	to: string
): Promise<string> {
	try {
		await history(namespace, path, to);
	} catch {
		// The target branch does not exist on this prompt yet — root it at the
		// source so the merge has somewhere to land.
		await createBranch(namespace, path, to, from);
	}
	return mergeBranch(namespace, path, to, from, `promote ${from} to ${to}`);
}

/** Branch names worth probing. There is no list-branches RPC — see branches(). */
export const KNOWN_BRANCHES = ['main', 'dev', 'staging', 'prod'];

// -------------------------------------------------------------- comparing

export interface Comparison {
	from: string;
	to: string;
	fromHash: string;
	toHash: string;
	changes: WireChange[];
	verdict: string;
	identical: boolean;
}

/** Diff two branch tips of one prompt — the branch-compare view. */
export async function compareBranches(
	namespace: string,
	path: string,
	from: string,
	to: string
): Promise<Comparison> {
	const [a, b] = await Promise.all([
		history(namespace, path, from),
		history(namespace, path, to)
	]);
	const fromHash = a[0]?.fullHash ?? '';
	const toHash = b[0]?.fullHash ?? '';
	if (!fromHash || !toHash) throw new PriomptError('not_found', 'One of those branches has no commits.');
	if (fromHash === toHash) {
		return { from, to, fromHash, toHash, changes: [], verdict: '', identical: true };
	}
	const changes = await diffCommits(namespace, path, fromHash, toHash);
	return { from, to, fromHash, toHash, changes, verdict: worstVerdict(changes), identical: false };
}

// ---------------------------------------------------------------- searching

export interface SearchHit {
	uri: string;
	path: string;
	namespace: string;
	line: number;
	text: string;
	matchedContent: boolean;
}

/**
 * Search, which the API has no RPC for. ListPrompts gives addresses; matching
 * content means fetching the prompts and scanning them here. That is honest but
 * linear, so it is capped — a real search needs an index on the server, and
 * saying so is better than quietly truncating.
 */
export const SEARCH_SCAN_LIMIT = 200;

export async function search(
	namespace: string,
	query: string
): Promise<{ hits: SearchHit[]; scanned: number; truncated: boolean }> {
	const q = query.trim().toLowerCase();
	if (!q) return { hits: [], scanned: 0, truncated: false };

	const entries = await listAll(`${SCHEME}${namespace}/`);
	const truncated = entries.length > SEARCH_SCAN_LIMIT;
	const scan = entries.slice(0, SEARCH_SCAN_LIMIT);
	const hits: SearchHit[] = [];

	for (const e of scan) {
		const { path } = fromURI(e.uri);
		if (path.toLowerCase().includes(q)) {
			hits.push({ uri: e.uri, path, namespace, line: 0, text: path, matchedContent: false });
			continue;
		}
		try {
			const p = await call<{ template: string }>('GetPrompt', { uri: e.uri, ref: '' });
			const lines = p.template.split('\n');
			const i = lines.findIndex((l) => l.toLowerCase().includes(q));
			if (i >= 0) {
				hits.push({ uri: e.uri, path, namespace, line: i + 1, text: lines[i].trim(), matchedContent: true });
			}
		} catch {
			// A prompt we cannot read is simply not a hit.
		}
	}
	return { hits, scanned: scan.length, truncated };
}

// ------------------------------------------------------------ server status

export interface ServerInfo {
	host: string;
	tls: boolean;
	authenticated: boolean;
	reachable: boolean;
	promptCount: number;
	orgs: string[];
	error?: string;
}

/** What the UI is actually connected to — the answer `priompt list` gives implicitly. */
export async function serverInfo(cfg: { host: string; tls: boolean; token: string }): Promise<ServerInfo> {
	const base = {
		host: cfg.host,
		tls: cfg.tls,
		authenticated: Boolean(cfg.token),
		reachable: false,
		promptCount: 0,
		orgs: [] as string[]
	};
	try {
		const entries = await listAll('');
		const orgs = [...new Set(entries.map((e) => fromURI(e.uri).namespace))].sort();
		return { ...base, reachable: true, promptCount: entries.length, orgs };
	} catch (e) {
		const err = e as PriomptError;
		return { ...base, error: `${err.code}: ${err.message}` };
	}
}

export { PriomptError };
