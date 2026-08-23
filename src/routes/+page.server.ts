import { listNamespaces } from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';
import { mockNamespaces } from '$lib/mocks/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	if (!isLive()) return { namespaces: mockNamespaces, live: false, error: null };
	try {
		return { namespaces: await listNamespaces(), live: true, error: null };
	} catch (e) {
		const err = e as PriomptError;
		return { namespaces: [], live: true, error: `${err.code}: ${err.message}` };
	}
};
