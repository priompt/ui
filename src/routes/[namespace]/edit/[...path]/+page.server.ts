import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseBranchAndPath } from '$lib/utils/path';
import { listBranches, rpc, uriFor } from '$lib/server/priompt';

export const load: PageServerLoad = async ({ params }) => {
	const branches = await listBranches(params.namespace);
	const { branch, folderPath } = parseBranchAndPath(params.path, branches);

	if (!branch) {
		throw error(404, 'Branch not found');
	}

	let prompt;
	try {
		prompt = await rpc.get(uriFor(params.namespace, folderPath), branch.name);
	} catch {
		throw error(404, 'File not found');
	}

	return {
		namespace: params.namespace,
		branch: branch.name,
		filePath: folderPath,
		fileName: folderPath.split('/').pop() ?? '',
		content: prompt.template,
		slots: prompt.slots ?? [],
		branches
	};
};

export const actions: Actions = {
	publish: async ({ params, request }) => {
		const form = await request.formData();
		const content = String(form.get('content') ?? '');
		const message = String(form.get('message') ?? '').trim();
		const branch = String(form.get('branch') ?? 'main');

		const branches = await listBranches(params.namespace);
		const { folderPath } = parseBranchAndPath(params.path, branches);
		const uri = uriFor(params.namespace, folderPath);

		if (!content.trim()) {
			return fail(400, { message: 'Template is empty' });
		}

		// The server validates declared slots against {placeholders} and rejects
		// a mismatch, so send exactly what the template uses.
		const slots = [...new Set([...content.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))];

		try {
			await rpc.publish(uri, content, slots, message || 'Update via UI', branch);
		} catch (e) {
			return fail(400, { message: (e as Error).message });
		}

		throw redirect(303, `/${params.namespace}/blob/${branch}/${folderPath}`);
	}
};
