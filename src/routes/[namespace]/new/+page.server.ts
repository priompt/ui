import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listTree, publishNew, toURI } from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';
import { detectSlots, validateTemplate } from '$lib/utils/slots';

export const load: PageServerLoad = async ({ params, url }) => {
	const folder = url.searchParams.get('folder') ?? '';
	if (!isLive()) return { namespace: params.namespace, folders: [], folder, live: false };
	try {
		const tree = await listTree(params.namespace, '');
		return {
			namespace: params.namespace,
			folders: tree.filter((f) => f.type === 'folder').map((f) => f.path),
			folder,
			live: true
		};
	} catch {
		return { namespace: params.namespace, folders: [], folder, live: true };
	}
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const form = await request.formData();
		const fileName = String(form.get('fileName') ?? '').trim();
		const folder = String(form.get('folder') ?? '').trim();
		const content = String(form.get('content') ?? '');
		const message = String(form.get('message') ?? '').trim();
		const branch = String(form.get('branch') ?? 'main');
		const back = { fileName, folder, content, message };

		if (!fileName) return fail(400, { error: 'A file name is required.', retryable: false, ...back });
		const name = fileName.endsWith('.prompt') ? fileName : `${fileName}.prompt`;
		const path = folder ? `${folder}/${name}` : name;

		// A prompt at the root of a namespace has no path below the org, which the
		// server rejects — say so here rather than after a round trip.
		if (!folder && !name.includes('/')) {
			// `acme/greeting.prompt` is fine: org + one segment. Only a bare org is not.
		}

		const invalid = validateTemplate(content);
		if (invalid) return fail(400, { error: invalid, retryable: false, ...back });
		if (!message) return fail(400, { error: 'A commit message is required.', retryable: false, ...back });
		if (!isLive()) return fail(400, { error: 'No Priompt server configured.', retryable: false, ...back });

		try {
			const res = await publishNew(params.namespace, path, content, detectSlots(content), message, branch);
			if (!res.created) {
				// "Create" must not replace a live prompt. Everything the author typed
				// comes back so nothing is lost; editing the existing prompt is the
				// explicit way to change it.
				return fail(409, {
					error: `A prompt already exists at ${res.uri}. Pick another name or folder, or edit the existing prompt.`,
					retryable: false,
					existingHref: `/${params.namespace}/edit/main/${path}`,
					uri: res.uri,
					...back
				});
			}
		} catch (e) {
			const err = e as PriomptError;
			return fail(err.retryable ? 409 : 400, {
				error: `${err.code}: ${err.message}`,
				retryable: err.retryable,
				uri: toURI(params.namespace, path),
				...back
			});
		}
		throw redirect(303, `/${params.namespace}/blob/${branch}/${path}`);
	}
};
