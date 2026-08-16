import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { mockCommits } from '$lib/mocks/data';

export const load: PageLoad = ({ params }) => {
	const commit = mockCommits.find((c) => c.hash === params.hash);

	if (!commit) {
		throw error(404, 'Commit not found');
	}

	return {
		namespace: params.namespace,
		commit
	};
};
