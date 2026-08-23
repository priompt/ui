import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { mockBranches } from '$lib/mocks/data';
import { branches, createBranch, rollback } from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';

export const load: PageServerLoad = async ({ params, url }) => {
	if (!isLive()) return { namespace: params.namespace, branches: mockBranches, path: '', live: false };

	// Branches in Priompt belong to a prompt, not to a namespace: each prompt has
	// its own independent history and its own refs. Showing them therefore needs
	// to know which prompt.
	const path = url.searchParams.get('path') ?? '';
	if (!path) {
		return {
			namespace: params.namespace, branches: [], path: '', live: true,
			note: 'Branches are per prompt. Open a prompt and use its branch selector.'
		};
	}
	try {
		return { namespace: params.namespace, branches: await branches(params.namespace, path), path, live: true };
	} catch (e) {
		const err = e as PriomptError;
		return { namespace: params.namespace, branches: [], path, live: true, error: `${err.code}: ${err.message}` };
	}
};

export const actions: Actions = {
	create: async ({ request, params }) => {
		if (!isLive()) return fail(400, { error: 'No Priompt server configured.' });
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const from = String(form.get('from') ?? 'main');
		const path = String(form.get('path') ?? '');
		if (!name) return fail(400, { error: 'A branch name is required.' });
		if (!path) return fail(400, { error: 'A branch belongs to a prompt; none was given.' });
		try {
			await createBranch(params.namespace, path, name, from);
			return { created: name };
		} catch (e) {
			const err = e as PriomptError;
			return fail(400, { error: `${err.code}: ${err.message}` });
		}
	},

	/** Move a branch back to an earlier commit — the documented instant rollback. */
	rollback: async ({ request, params }) => {
		if (!isLive()) return fail(400, { error: 'No Priompt server configured.' });
		const form = await request.formData();
		const path = String(form.get('path') ?? '');
		const commit = String(form.get('commit') ?? '');
		const branch = String(form.get('branch') ?? 'main');
		if (!path || !commit) return fail(400, { error: 'Rollback needs a prompt path and a commit.' });
		try {
			const versionHash = await rollback(params.namespace, path, commit, branch);
			return { rolledBack: commit, versionHash };
		} catch (e) {
			const err = e as PriomptError;
			return fail(err.retryable ? 409 : 400, { error: `${err.code}: ${err.message}`, retryable: err.retryable });
		}
	}
};
