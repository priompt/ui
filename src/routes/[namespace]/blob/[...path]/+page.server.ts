import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { parseBranchAndPath } from '$lib/utils/path';
import { detectSlots } from '$lib/utils/slots';
import { mockBranches, mockPromptContents } from '$lib/mocks/data';
import { getPrompt } from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';
import { splitRef, httpStatus } from '$lib/server/source';

export const load: PageServerLoad = async ({ params }) => {
	if (!isLive()) {
		const { branch, folderPath } = parseBranchAndPath(params.path, mockBranches);
		if (!branch) throw error(404, 'Branch not found');
		const promptContent = mockPromptContents[folderPath];
		if (!promptContent) throw error(404, 'File not found');
		return {
			namespace: params.namespace,
			branch: branch.name,
			filePath: folderPath,
			fileName: folderPath.split('/').pop() ?? '',
			fileSize: new TextEncoder().encode(promptContent.content).length,
			content: promptContent.content,
			slots: detectSlots(promptContent.content),
			lastCommit: promptContent.lastCommit,
			branches: mockBranches,
			live: false
		};
	}

	const { branch, path } = splitRef(params.path);
	try {
		const p = await getPrompt(params.namespace, path, branch);
		return {
			namespace: params.namespace,
			branch,
			filePath: path,
			fileName: path.split('/').pop() ?? '',
			fileSize: new TextEncoder().encode(p.content).length,
			content: p.content,
			// The server is the authority on slots — it validated them on write and
			// validates them again on serve. Do not re-derive them in the browser.
			slots: p.slots,
			lastCommit: p.lastCommit,
			branches: [
				{ name: branch, isDefault: branch === 'main', isServing: branch === 'main',
				  lastCommit: p.lastCommit }
			],
			live: true
		};
	} catch (e) {
		const err = e as PriomptError;
		throw error(httpStatus(err), err.message);
	}
};
