import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { parseBranchAndPath } from '$lib/utils/path';
import { mockBranches, mockCommits } from '$lib/mocks/data';
import { history } from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';
import { splitRef } from '$lib/server/source';

export const load: PageServerLoad = async ({ params }) => {
	if (!isLive()) {
		const { branch, folderPath } = parseBranchAndPath(params.path, mockBranches);
		if (!branch) throw error(404, 'Branch not found');
		const filtered = folderPath
			? mockCommits.filter((c) => c.files.some((f) => f === folderPath || f.startsWith(folderPath + '/')))
			: mockCommits;
		const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		return {
			namespace: params.namespace,
			branch: branch.name,
			filePath: folderPath,
			commits: sorted,
			branches: mockBranches,
			live: false
		};
	}

	// Priompt's history is per prompt — every prompt has its own independent
	// chain — so there is no branch-wide log to show without a path.
	const { branch, path } = splitRef(params.path);
	if (!path) {
		return {
			namespace: params.namespace, branch, filePath: '',
			commits: [], branches: [], live: true,
			note: 'History is per prompt. Open a prompt to see its commits.'
		};
	}
	try {
		const log = await history(params.namespace, path, branch);
		return {
			namespace: params.namespace,
			branch,
			filePath: path,
			commits: log.map((c) => ({ ...c, files: [path], diff: undefined, semanticVerdict: undefined })),
			branches: [],
			live: true
		};
	} catch (e) {
		const err = e as PriomptError;
		throw error(err.code === 'permission_denied' ? 403 : 404, err.message);
	}
};
