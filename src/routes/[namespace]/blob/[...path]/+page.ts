import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { parseBranchAndPath } from '$lib/utils/path';
import { detectSlots } from '$lib/utils/slots';
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

	const slots = detectSlots(promptContent.content);
	const fileName = folderPath.split('/').pop() ?? '';
	const fileSize = new TextEncoder().encode(promptContent.content).length;

	return {
		namespace: params.namespace,
		branch: branch.name,
		filePath: folderPath,
		fileName,
		fileSize,
		content: promptContent.content,
		slots,
		lastCommit: promptContent.lastCommit,
		branches: mockBranches
	};
};
