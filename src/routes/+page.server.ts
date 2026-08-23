import { listNamespaces } from '$lib/server/api';
import { isLive, readConfig, PriomptError } from '$lib/server/client';
import { mockNamespaces } from '$lib/mocks/data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const cfg = readConfig();
	if (!isLive() || !cfg) {
		return { namespaces: mockNamespaces, live: false, error: null, scopedHint: false };
	}
	try {
		return { namespaces: await listNamespaces(cfg.org), live: true, error: null, scopedHint: false };
	} catch (e) {
		const err = e as PriomptError;
		// The distinctive failure of an org-scoped token: it may not enumerate
		// everything, which is correct, and which no amount of retrying fixes.
		// Say what to do about it rather than surfacing the raw denial.
		// Scoped token, no org configured: actionable guidance, not a raw denial.
		// Scoped token *with* an org configured that still gets denied means the
		// org is wrong — that one is a real error worth showing.
		const scopedHint = err.code === 'permission_denied' && !cfg.org;
		return {
			namespaces: [],
			live: true,
			error: scopedHint ? null : `${err.code}: ${err.message}`,
			scopedHint
		};
	}
};
