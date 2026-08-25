import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { parseCompareSpec } from '$lib/utils/path';
import { mockBranches, mockComparisons } from '$lib/mocks/data';
import { compareBranches, getPrompt, KNOWN_BRANCHES } from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';
import { httpStatus } from '$lib/server/source';
import { unifiedDiff } from '$lib/utils/diff';

export const load: PageServerLoad = async ({ params, url }) => {
	const spec = parseCompareSpec(params.spec);
	if (!spec) throw error(400, 'Invalid comparison format. Use base...head');

	if (!isLive()) {
		const base = mockBranches.find((b) => b.name === spec.base);
		const head = mockBranches.find((b) => b.name === spec.head);
		if (!base) throw error(404, `Branch "${spec.base}" not found`);
		if (!head) throw error(404, `Branch "${spec.head}" not found`);
		return {
			namespace: params.namespace, base: spec.base, head: spec.head,
			branches: mockBranches,
			comparison: mockComparisons[`${spec.base}...${spec.head}`] ?? { commitsAhead: 0, commitsBehind: 0, filesChanged: 0, fileDiffs: [] },
			changes: [], verdict: '', identical: false, path: '', live: false, error: null
		};
	}

	// Comparison is per prompt: branches are per prompt, so two branch names on
	// their own do not identify anything to diff.
	const path = url.searchParams.get('path') ?? '';
	if (!path) {
		return {
			namespace: params.namespace, base: spec.base, head: spec.head, branches: [],
			comparison: { commitsAhead: 0, commitsBehind: 0, filesChanged: 0, fileDiffs: [] },
			changes: [], verdict: '', identical: false, path: '', live: true,
			error: 'Comparison is per prompt — add ?path=<prompt path>.'
		};
	}

	try {
		const cmp = await compareBranches(params.namespace, path, spec.base, spec.head);
		const [before, after] = await Promise.all([
			getPrompt(params.namespace, path, spec.base).catch(() => null),
			getPrompt(params.namespace, path, spec.head).catch(() => null)
		]);
		// Same renderer as the commit view, driven by the server's hunk ranges.
		const diff = cmp.identical
			? ''
			: unifiedDiff(
					before?.content ?? '',
					after?.content ?? '',
					cmp.changes.map((c) => ({
						oldStart: c.old_start,
						oldEnd: c.old_end,
						newStart: c.new_start,
						newEnd: c.new_end,
						classification: c.classification
					}))
				);

		return {
			namespace: params.namespace,
			base: spec.base,
			head: spec.head,
			branches: KNOWN_BRANCHES.map((name) => ({
				name, isDefault: name === 'main', isServing: name === 'main',
				lastCommit: { hash: '', message: '', author: '', date: '' }
			})),
			comparison: {
				commitsAhead: cmp.identical ? 0 : 1,
				commitsBehind: 0,
				filesChanged: cmp.identical ? 0 : 1,
				fileDiffs: diff ? [{ path, diff }] : []
			},
			changes: cmp.changes,
			verdict: cmp.verdict,
			identical: cmp.identical,
			path,
			live: true,
			error: null
		};
	} catch (e) {
		const err = e as PriomptError;
		throw error(httpStatus(err), err.message);
	}
};
