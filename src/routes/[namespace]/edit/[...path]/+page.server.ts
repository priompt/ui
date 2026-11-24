import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseBranchAndPath } from '$lib/utils/path';
import { mockBranches, mockPromptContents } from '$lib/mocks/data';
import { detectSlots, validateTemplate } from '$lib/utils/slots';
import { getPrompt, publishIfCurrent, diffDraft, worstVerdict, branches } from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';
import { splitRef, httpStatus } from '$lib/server/source';

export const load: PageServerLoad = async ({ params }) => {
	if (!isLive()) {
		const { branch, folderPath } = parseBranchAndPath(params.path, mockBranches);
		if (!branch) throw error(404, 'Branch not found');
		const promptContent = mockPromptContents[folderPath];
		if (!promptContent) throw error(404, 'File not found');
		return {
			namespace: params.namespace, branch: branch.name, filePath: folderPath,
			fileName: folderPath.split('/').pop() ?? '', content: promptContent.content,
			branches: mockBranches, bases: {} as Record<string, string>, live: false
		};
	}

	const { branch, path } = splitRef(params.path);
	try {
		// Every branch of this prompt, so the commit dialog can commit to any of
		// them rather than only the one the editor was opened on.
		const [p, bs] = await Promise.all([
			getPrompt(params.namespace, path, branch),
			branches(params.namespace, path).catch(() => [])
		]);
		const current = { name: branch, isDefault: branch === 'main', isServing: branch === 'main', lastCommit: p.lastCommit };
		// The tip of each branch as of this load, i.e. the version the edit starts
		// from. A save is refused if the branch it targets has moved since. The
		// open branch uses the commit GetPrompt read the content from, so the base
		// and the content can never come from different versions.
		const bases: Record<string, string> = {};
		for (const b of bs) if (b.lastCommit.fullHash) bases[b.name] = b.lastCommit.fullHash;
		if (p.commitHash) bases[branch] = p.commitHash;
		return {
			namespace: params.namespace, branch, filePath: path,
			fileName: path.split('/').pop() ?? '', content: p.content,
			branches: bs.some((b) => b.name === branch) ? bs : [current, ...bs],
			bases,
			live: true
		};
	} catch (e) {
		const err = e as PriomptError;
		throw error(httpStatus(err), err.message);
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
		// The full hash of the target branch's tip when the editor loaded.
		const base = String(form.get('base') ?? '');

		// The same rules the server enforces, applied before the round trip so the
		// author gets the specific complaint rather than a generic rejection.
		const invalid = validateTemplate(content);
		if (invalid) return fail(400, { error: invalid, content, message });
		if (!message) return fail(400, { error: 'A commit message is required.', content, message });

		if (!isLive()) return fail(400, { error: 'No Priompt server configured.', content, message });

		const { path } = splitRef(params.path);
		try {
			const res = await publishIfCurrent(
				params.namespace, path, content, detectSlots(content), message, branch, base
			);
			if (res.conflict) {
				// The branch moved after the editor loaded (another tab, another
				// user, the CLI or CI). Publishing now would silently replace that
				// version, so refuse and hand the draft back to be reapplied.
				return fail(409, {
					error:
						`This prompt changed since you opened it: ${branch} has a newer version. ` +
						'Your edit was not saved. Review the current version, then reapply your changes.',
					conflict: true,
					currentHref: `/${params.namespace}/blob/${branch}/${path}`,
					retryable: false,
					content,
					message
				});
			}
			return { saved: true, versionHash: res.versionHash };
		} catch (e) {
			const err = e as PriomptError;
			// ABORTED is the server's own commit race (two publishes inside one
			// transaction); an edit made against an old version is caught above, not
			// here. The write is safe to retry once the author has seen what changed.
			// UNAVAILABLE means the change is stored but the cache could not be
			// cleared, which is also a retry.
			return fail(err.retryable ? 409 : 400, {
				error: `${err.code}: ${err.message}`,
				retryable: err.retryable,
				content,
				message
			});
		}
	}
};
