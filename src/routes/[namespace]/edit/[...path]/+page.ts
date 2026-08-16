import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { parseBranchAndPath } from '$lib/utils/path';
import { mockBranches, mockPromptContents } from '$lib/mocks/data';

export const load: PageLoad = ({ params }) => {
	const { branch, folderPath } = parseBranchAndPath(params.path, mockBranches);

	if (!branch) {
		throw error(404, 'Branch not found');
	}

	const promptContent = mockPromptContents[folderPath];

	if (!promptContent) {
		throw error(404, 'File not found');
	}

	const fileName = folderPath.split('/').pop() ?? '';

	return {
		namespace: params.namespace,
		branch: branch.name,
		filePath: folderPath,
		fileName,
		content: promptContent.content,
		branches: mockBranches
	};
};
