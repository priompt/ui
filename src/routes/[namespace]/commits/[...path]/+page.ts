import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { parseBranchAndPath } from '$lib/utils/path';
import { mockBranches, mockCommits } from '$lib/mocks/data';

export const load: PageLoad = ({ params }) => {
	const { branch, folderPath } = parseBranchAndPath(params.path, mockBranches);

	if (!branch) {
		throw error(404, 'Branch not found');
	}

	// Filter commits: if folderPath is provided, only show commits that affect that file
	// Otherwise show all commits (branch-level history)
	const filteredCommits = folderPath
		? mockCommits.filter(
				(c) => c.files.some((f) => f === folderPath || f.startsWith(folderPath + '/'))
			)
		: mockCommits;

	// Sort reverse-chronological (already sorted in mock, but ensure)
	const sorted = [...filteredCommits].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);

	return {
		namespace: params.namespace,
		branch: branch.name,
		filePath: folderPath,
		commits: sorted
	};
};
