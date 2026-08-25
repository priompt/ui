import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { mockBranches } from '$lib/mocks/data';
import {
	branches, createBranch, mergeBranch, promote, rollback, history, listAll, fromURI, KNOWN_BRANCHES, SUFFIX
} from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';

export const load: PageServerLoad = async ({ params, url }) => {
	if (!isLive()) {
		return { namespace: params.namespace, branches: mockBranches, prompts: [], path: '', commits: [], known: KNOWN_BRANCHES, live: false, error: null };
	}

	// Branches belong to a prompt, not to a namespace: each prompt has its own
	// refs and its own independent history. So the page needs a prompt selected,
	// and offers the list to pick from.
	const path = url.searchParams.get('path') ?? '';
	let prompts: string[] = [];
	try {
		// Carry the .prompt suffix so these match the paths used everywhere else
		// in the UI — without it the selector never matches the current prompt.
		prompts = (await listAll(`priompt://${params.namespace}/`))
			.map((e) => `${fromURI(e.uri).path}${SUFFIX}`)
			.sort();
	} catch {
		// fall through — the error below will explain
	}
	if (!path) {
		return { namespace: params.namespace, branches: [], prompts, path: '', commits: [], known: KNOWN_BRANCHES, live: true, error: null };
	}
	try {
		const [bs, log] = await Promise.all([
			branches(params.namespace, path),
			history(params.namespace, path, 'main').catch(() => [])
		]);
		return { namespace: params.namespace, branches: bs, prompts, path, commits: log, known: KNOWN_BRANCHES, live: true, error: null };
	} catch (e) {
		const err = e as PriomptError;
		return { namespace: params.namespace, branches: [], prompts, path, commits: [], known: KNOWN_BRANCHES, live: true, error: `${err.code}: ${err.message}` };
	}
};

/** Turn a gRPC failure into a form result, keeping the retry signal intact. */
function formError(e: unknown) {
	const err = e as PriomptError;
	return fail(err.retryable ? 409 : 400, { error: `${err.code}: ${err.message}`, retryable: err.retryable });
}

export const actions: Actions = {
	create: async ({ request, params }) => {
		if (!isLive()) return fail(400, { error: 'No Priompt server configured.', retryable: false });
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		const from = String(f.get('from') ?? 'main');
		const path = String(f.get('path') ?? '');
		if (!name) return fail(400, { error: 'A branch name is required.', retryable: false });
		if (!path) return fail(400, { error: 'A branch belongs to a prompt; none was selected.', retryable: false });
		try {
			await createBranch(params.namespace, path, name, from);
			return { ok: `Created ${name} from ${from}.` };
		} catch (e) {
			return formError(e);
		}
	},

	merge: async ({ request, params }) => {
		if (!isLive()) return fail(400, { error: 'No Priompt server configured.', retryable: false });
		const f = await request.formData();
		const from = String(f.get('from') ?? '');
		const into = String(f.get('into') ?? 'main');
		const path = String(f.get('path') ?? '');
		const message = String(f.get('message') ?? '');
		if (!from || !path) return fail(400, { error: 'Merging needs a source branch and a prompt.', retryable: false });
		try {
			const hash = await mergeBranch(params.namespace, path, into, from, message);
			return { ok: `Merged ${from} into ${into} (${hash.slice(0, 7)}).` };
		} catch (e) {
			return formError(e);
		}
	},

	/** dev -> staging -> prod, the way `promptctl promote` models environments. */
	promote: async ({ request, params }) => {
		if (!isLive()) return fail(400, { error: 'No Priompt server configured.', retryable: false });
		const f = await request.formData();
		const from = String(f.get('from') ?? '');
		const to = String(f.get('to') ?? '');
		const path = String(f.get('path') ?? '');
		if (!from || !to || !path) return fail(400, { error: 'Promotion needs a source, a target and a prompt.', retryable: false });
		if (from === to) return fail(400, { error: 'Source and target are the same branch.', retryable: false });
		try {
			const hash = await promote(params.namespace, path, from, to);
			return { ok: `Promoted ${from} to ${to} (${hash.slice(0, 7)}).` };
		} catch (e) {
			return formError(e);
		}
	},

	/** Move a branch back to an earlier commit — the documented instant rollback. */
	rollback: async ({ request, params }) => {
		if (!isLive()) return fail(400, { error: 'No Priompt server configured.', retryable: false });
		const f = await request.formData();
		const path = String(f.get('path') ?? '');
		const commit = String(f.get('commit') ?? '');
		const branch = String(f.get('branch') ?? 'main');
		if (!path || !commit) return fail(400, { error: 'Rollback needs a prompt and a commit.', retryable: false });
		try {
			await rollback(params.namespace, path, commit, branch);
			return { ok: `${branch} now points at ${commit.slice(0, 7)}. Agents see it immediately.` };
		} catch (e) {
			return formError(e);
		}
	}
};
