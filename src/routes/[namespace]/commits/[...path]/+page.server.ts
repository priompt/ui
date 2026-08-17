import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { parseBranchAndPath } from '$lib/utils/path';
import { listBranches, listPaths, rpc, toCommit, uriFor } from '$lib/server/priompt';
import type { Commit } from '$lib/types';

export const load: PageServerLoad = async ({ params }) => {
	const branches = await listBranches(params.namespace);
	const { branch, folderPath } = parseBranchAndPath(params.path, branches);

	if (!branch) {
		throw error(404, 'Branch not found');
	}

	// History is per-prompt on the server. For a folder (or the namespace root)
	// we fan out over the prompts underneath and merge, newest first.
	const all = await listPaths(params.namespace);
	const targets = folderPath
		? all.filter((p) => p === folderPath || p.startsWith(folderPath + '/'))
		: all;

	const commits: Commit[] = [];
	for (const path of targets) {
		try {
			const { commits: raw } = await rpc.history(uriFor(params.namespace, path), branch.name);
			for (const c of raw) commits.push(toCommit(c, [path]));
		} catch {
			// a prompt with no history on this branch contributes nothing
		}
	}

	commits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return { namespace: params.namespace, branch: branch.name, filePath: folderPath, commits };
};
