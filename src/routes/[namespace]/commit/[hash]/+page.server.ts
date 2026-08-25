import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { mockCommits } from '$lib/mocks/data';
import { diffCommits, getPrompt, history, worstVerdict, type WireChange } from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';
import { unifiedDiff, type SemanticChange } from '$lib/utils/diff';


/**
 * The wire shape is snake_case (the proto is loaded with keepCase), while the
 * diff renderer takes camelCase. Convert once, here, rather than teaching the
 * tested renderer about the transport.
 */
function toHunks(changes: WireChange[]): SemanticChange[] {
	return changes.map((c) => ({
		oldStart: c.old_start,
		oldEnd: c.old_end,
		newStart: c.new_start,
		newEnd: c.new_end,
		classification: c.classification
	}));
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
				// Rendered from the hunk ranges the server already computed, so the
				// textual diff and the semantic verdict describe the same regions.
				diff: unifiedDiff(before?.content ?? '', content?.content ?? '', toHunks(changes))
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
