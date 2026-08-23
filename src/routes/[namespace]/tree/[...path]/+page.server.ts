import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { parseBranchAndPath } from '$lib/utils/path';
import { mockBranches, mockAcmeFiles, mockFolderContents } from '$lib/mocks/data';
import { listTree } from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';
import { splitRef } from '$lib/server/source';

export const load: PageServerLoad = async ({ params }) => {
	if (!params.path) throw redirect(307, `/${params.namespace}/tree/main`);

	if (!isLive()) {
		const { branch, folderPath } = parseBranchAndPath(params.path, mockBranches);
		if (!branch) throw error(404, 'Branch not found');
		const files = folderPath === '' ? mockAcmeFiles : mockFolderContents[folderPath];
		if (!files) throw error(404, 'Folder not found');
		return {
			namespace: params.namespace,
			branch: branch.name,
			folderPath,
			files,
			pathSegments: folderPath ? folderPath.split('/') : [],
			branches: mockBranches,
			live: false
		};
	}

	// Live: the first URL segment is the branch. Priompt has no repo-wide branch
	// list to match against greedily — branches are per prompt — so the mock
	// longest-prefix trick has nothing to consult here.
	const { branch, path: folderPath } = splitRef(params.path);
	try {
		const files = await listTree(params.namespace, folderPath);
		return {
			namespace: params.namespace,
			branch,
			folderPath,
			files,
			pathSegments: folderPath ? folderPath.split('/') : [],
			branches: [
				{ name: branch, isDefault: branch === 'main', isServing: branch === 'main',
				  lastCommit: { hash: '', message: '', author: '', date: '' } }
			],
			live: true
		};
	} catch (e) {
		const err = e as PriomptError;
		throw error(err.code === 'permission_denied' ? 403 : 404, err.message);
	}
};
