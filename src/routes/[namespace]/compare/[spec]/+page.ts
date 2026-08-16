import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { parseCompareSpec } from '$lib/utils/path';
import { mockBranches, mockComparisons } from '$lib/mocks/data';

export const load: PageLoad = ({ params }) => {
	const spec = parseCompareSpec(params.spec);

	if (!spec) {
		throw error(400, 'Invalid comparison format. Use base...head');
	}

	const baseBranch = mockBranches.find((b) => b.name === spec.base);
	const headBranch = mockBranches.find((b) => b.name === spec.head);

	if (!baseBranch) {
		throw error(404, `Branch "${spec.base}" not found`);
	}
	if (!headBranch) {
		throw error(404, `Branch "${spec.head}" not found`);
	}

	// Look up comparison data
	const comparisonKey = `${spec.base}...${spec.head}`;
	const comparison = mockComparisons[comparisonKey] ?? {
		commitsAhead: 0,
		commitsBehind: 0,
		filesChanged: 0,
		fileDiffs: []
	};

	return {
		namespace: params.namespace,
		base: spec.base,
		head: spec.head,
		branches: mockBranches,
		comparison
	};
};
