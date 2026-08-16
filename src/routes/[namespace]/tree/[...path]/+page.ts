import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { parseBranchAndPath } from '$lib/utils/path';
import { mockBranches, mockAcmeFiles, mockFolderContents } from '$lib/mocks/data';

export const load: PageLoad = ({ params }) => {
	if (!params.path) {
		throw redirect(307, `/${params.namespace}/tree/main`);
	}

	const { branch, folderPath } = parseBranchAndPath(params.path, mockBranches);

	if (!branch) {
		throw error(404, 'Branch not found');
	}

	const files = folderPath === '' ? mockAcmeFiles : mockFolderContents[folderPath];

	if (!files) {
		throw error(404, 'Folder not found');
	}

	return {
		namespace: params.namespace,
		branch: branch.name,
		folderPath,
		files,
		pathSegments: folderPath ? folderPath.split('/') : [],
		branches: mockBranches
	};
};
