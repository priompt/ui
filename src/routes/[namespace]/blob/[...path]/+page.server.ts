import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { parseBranchAndPath } from '$lib/utils/path';
import { listBranches, lastCommit, rpc, uriFor } from '$lib/server/priompt';

export const load: PageServerLoad = async ({ params }) => {
	const branches = await listBranches(params.namespace);
	const { branch, folderPath } = parseBranchAndPath(params.path, branches);

	if (!branch) {
		throw error(404, 'Branch not found');
	}

	let prompt;
	try {
		prompt = await rpc.get(uriFor(params.namespace, folderPath), branch.name);
	} catch {
		throw error(404, 'File not found');
	}

	return {
		namespace: params.namespace,
		branch: branch.name,
		filePath: folderPath,
		fileName: folderPath.split('/').pop() ?? '',
		fileSize: new TextEncoder().encode(prompt.template).length,
		content: prompt.template,
		// the server is the authority on slots — it validated them on write
		slots: prompt.slots ?? [],
		versionHash: prompt.versionHash,
		lastCommit: await lastCommit(params.namespace, folderPath),
		branches
	};
};
