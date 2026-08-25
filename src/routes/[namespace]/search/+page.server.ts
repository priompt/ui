import type { PageServerLoad } from './$types';
import { search, SEARCH_SCAN_LIMIT } from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';
import { mockAcmeFiles } from '$lib/mocks/data';

export const load: PageServerLoad = async ({ params, url }) => {
	const query = url.searchParams.get('q') ?? '';

	if (!isLive()) {
		const q = query.trim().toLowerCase();
		return {
			namespace: params.namespace,
			query,
			hits: q
				? mockAcmeFiles
						.filter((f) => f.name.toLowerCase().includes(q))
						.map((f) => ({ uri: '', path: f.path, namespace: params.namespace, line: 0, text: f.name, matchedContent: false }))
				: [],
			scanned: 0,
			truncated: false,
			limit: SEARCH_SCAN_LIMIT,
			live: false,
			error: null
		};
	}

	if (!query.trim()) {
		return { namespace: params.namespace, query, hits: [], scanned: 0, truncated: false, limit: SEARCH_SCAN_LIMIT, live: true, error: null };
	}
	try {
		const r = await search(params.namespace, query);
		return { namespace: params.namespace, query, ...r, limit: SEARCH_SCAN_LIMIT, live: true, error: null };
	} catch (e) {
		const err = e as PriomptError;
		return {
			namespace: params.namespace, query, hits: [], scanned: 0, truncated: false,
			limit: SEARCH_SCAN_LIMIT, live: true, error: `${err.code}: ${err.message}`
		};
	}
};
