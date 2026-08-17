import type { PageServerLoad } from './$types';
import { listNamespaces } from '$lib/server/priompt';

export const load: PageServerLoad = async () => {
	try {
		return { namespaces: await listNamespaces(), offline: false };
	} catch (e) {
		return { namespaces: [], offline: true, reason: (e as Error).message };
	}
};
