import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseBranchAndPath } from '$lib/utils/path';
import { mockBranches, mockPromptContents } from '$lib/mocks/data';
import { detectSlots, validateTemplate } from '$lib/utils/slots';
import { getPrompt, publish, diffDraft, worstVerdict } from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';
import { splitRef } from '$lib/server/source';

export const load: PageServerLoad = async ({ params }) => {
	if (!isLive()) {
		const { branch, folderPath } = parseBranchAndPath(params.path, mockBranches);
		if (!branch) throw error(404, 'Branch not found');
		const promptContent = mockPromptContents[folderPath];
		if (!promptContent) throw error(404, 'File not found');
		return {
			namespace: params.namespace, branch: branch.name, filePath: folderPath,
			fileName: folderPath.split('/').pop() ?? '', content: promptContent.content,
			branches: mockBranches, live: false
		};
	}

	const { branch, path } = splitRef(params.path);
	try {
		const p = await getPrompt(params.namespace, path, branch);
		return {
			namespace: params.namespace, branch, filePath: path,
			fileName: path.split('/').pop() ?? '', content: p.content,
			branches: [{ name: branch, isDefault: branch === 'main', isServing: branch === 'main', lastCommit: p.lastCommit }],
			live: true
		};
	} catch (e) {
		const err = e as PriomptError;
		throw error(err.code === 'permission_denied' ? 403 : 404, err.message);
	}
};

export const actions: Actions = {
	/**
	 * Ask the server what an unsaved edit means before committing it. This is the
	 * gate the product is built around and the UI had no way to reach: a
	 * structural verdict is the one an author should see *before* they publish,
	 * not afterwards in the history.
	 */
	preview: async ({ request, params }) => {
		if (!isLive()) return fail(400, { error: 'No Priompt server configured.' });
		const form = await request.formData();
		const content = String(form.get('content') ?? '');
		const { path } = splitRef(params.path);
		try {
			const changes = await diffDraft(params.namespace, path, content);
			return { changes, verdict: worstVerdict(changes) };
		} catch (e) {
			const err = e as PriomptError;
			return fail(400, { error: `${err.code}: ${err.message}` });
		}
	},

	save: async ({ request, params }) => {
		const form = await request.formData();
		const content = String(form.get('content') ?? '');
		const message = String(form.get('message') ?? '').trim();
		const branch = String(form.get('branch') ?? 'main');

		// The same rules the server enforces, applied before the round trip so the
		// author gets the specific complaint rather than a generic rejection.
		const invalid = validateTemplate(content);
		if (invalid) return fail(400, { error: invalid, content, message });
		if (!message) return fail(400, { error: 'A commit message is required.', content, message });

		if (!isLive()) return fail(400, { error: 'No Priompt server configured.', content, message });

		const { path } = splitRef(params.path);
		try {
			const versionHash = await publish(
				params.namespace, path, content, detectSlots(content), message, branch
			);
			return { saved: true, versionHash };
		} catch (e) {
			const err = e as PriomptError;
			// ABORTED means someone else published first; the write is safe to retry
			// once the author has seen what changed. UNAVAILABLE means the change is
			// stored but the cache could not be cleared — also a retry.
			return fail(err.retryable ? 409 : 400, {
				error: `${err.code}: ${err.message}`,
				retryable: err.retryable,
				content,
				message
			});
		}
	}
};
