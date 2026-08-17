import type { PageServerLoad } from './$types';
import { listBranches, listTree } from '$lib/server/priompt';

export const load: PageServerLoad = async ({ params }) => {
	const [branches, files] = await Promise.all([
		listBranches(params.namespace),
		listTree(params.namespace, '')
	]);

	return { namespace: params.namespace, branches, files };
};
