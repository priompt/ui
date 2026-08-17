import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { commitDetail } from '$lib/server/priompt';

export const load: PageServerLoad = async ({ params }) => {
	const commit = await commitDetail(params.namespace, params.hash);

	if (!commit) {
		throw error(404, 'Commit not found');
	}

	return { namespace: params.namespace, commit };
};
