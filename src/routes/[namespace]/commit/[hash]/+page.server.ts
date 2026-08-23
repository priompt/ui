import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { mockCommits } from '$lib/mocks/data';
import { diffCommits, getPrompt, history, worstVerdict, type WireChange } from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';

/**
 * A plain unified line diff, so the file pane shows the textual change beside
 * the semantic one. The two answer different questions and the page wants both:
 * this is what moved, the panel below is what it meant.
 */
function lineDiff(before: string, after: string, path: string): string {
	if (before === after) return '';
	const a = before.length ? before.split('\n') : [];
	const b = after.split('\n');
	const out = [`--- a/${path}`, `+++ b/${path}`, `@@ -1,${a.length} +1,${b.length} @@`];
	for (const line of a) out.push(`-${line}`);
	for (const line of b) out.push(`+${line}`);
	return out.join('\n');
}

export const load: PageServerLoad = async ({ params, url }) => {
	if (!isLive()) {
		const commit = mockCommits.find((c) => c.hash === params.hash);
		if (!commit) throw error(404, 'Commit not found');
		return { namespace: params.namespace, commit, changes: [], verdict: '', live: false };
	}

	// A commit is only addressable together with the prompt it belongs to —
	// commit identity includes the URI — so the path travels in the query string.
	const path = url.searchParams.get('path') ?? '';
	if (!path) throw error(400, 'A commit needs its prompt path: add ?path=<prompt path>');

	try {
		const log = await history(params.namespace, path, 'main');
		const idx = log.findIndex(
			(c) => c.fullHash.startsWith(params.hash) || params.hash.startsWith(c.hash)
		);
		if (idx < 0) throw error(404, 'Commit not found in this prompt history');

		const commit = log[idx];
		const parent = log[idx + 1];

		// The semantic verdict, which is the whole point of the product and did
		// not appear anywhere in this UI before. There is no parent for the root
		// commit, so there is nothing to diff against.
		let changes: WireChange[] = [];
		if (parent) {
			try {
				// Full hashes: the API resolves an exact commit, not a prefix.
				changes = await diffCommits(params.namespace, path, parent.fullHash, commit.fullHash);
			} catch {
				// A diff failure must not take the commit page down with it.
			}
		}

		const content = await getPrompt(params.namespace, path, commit.fullHash).catch(() => null);
		const before = parent
			? await getPrompt(params.namespace, path, parent.fullHash).catch(() => null)
			: null;

		return {
			namespace: params.namespace,
			// semanticVerdict is deliberately left unset: it renders in its own
			// panel with the signals behind it, not as a bare word in the slot the
			// fixtures used for a prose summary.
			commit: {
				...commit,
				files: [path],
				diff: lineDiff(before?.content ?? '', content?.content ?? '', path)
			},
			path,
			content: content?.content ?? '',
			changes,
			verdict: worstVerdict(changes),
			live: true
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		const err = e as PriomptError;
		throw error(err.code === 'permission_denied' ? 403 : 404, err.message);
	}
};
