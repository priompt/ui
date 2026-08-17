import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { parseBranchAndPath } from '$lib/utils/path';
import { listBranches, listTree } from '$lib/server/priompt';

export const load: PageServerLoad = async ({ params }) => {
	if (!params.path) {
		throw redirect(307, `/${params.namespace}/tree/main`);
	}

	const branches = await listBranches(params.namespace);
	const { branch, folderPath } = parseBranchAndPath(params.path, branches);

	if (!branch) {
		throw error(404, 'Branch not found');
	}

	const files = await listTree(params.namespace, folderPath);

	if (files.length === 0 && folderPath !== '') {
		throw error(404, 'Folder not found');
	}

	return {
		namespace: params.namespace,
		branch: branch.name,
		folderPath,
		files,
		pathSegments: folderPath ? folderPath.split('/') : [],
		branches
	};
};
