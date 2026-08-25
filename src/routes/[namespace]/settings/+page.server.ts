import type { PageServerLoad } from './$types';
import { serverInfo } from '$lib/server/api';
import { isLive, readConfig } from '$lib/server/client';

export const load: PageServerLoad = async ({ params }) => {
	const cfg = readConfig();
	if (!isLive() || !cfg) {
		return { namespace: params.namespace, live: false, info: null };
	}
	// Deliberately not the token itself — this page is rendered to a browser.
	return { namespace: params.namespace, live: true, info: await serverInfo(cfg) };
};
