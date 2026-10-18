// Run: pnpm test  (node's built-in runner + type stripping, no framework)
// These check the requests api.ts puts on the wire, against a fake server that
// decodes them with the real proto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakeServer } from './api-harness.ts';

test('diffDraft sends the edit as new_template', async () => {
	// The bug this guards: the edit went out as `template`, which the proto does
	// not have, so the server diffed against an empty draft and every check came
	// back `structural`.
	const s = await fakeServer({ DiffPrompt: () => ({ changes: [] }) });
	try {
		await s.api.diffDraft('acme', 'support/agent.prompt', 'edited text');
		assert.deepEqual(s.calls, [
			{ method: 'DiffPrompt', req: { uri: 'priompt://acme/support/agent', new_template: 'edited text' } }
		]);
	} finally {
		s.close();
	}
});

const commit = (h: string) => ({
	hash: h.repeat(64), version_hash: 'v'.repeat(64), parent: '', parent2: '',
	author: 'ana', message: h, created_at: '2026-10-18T00:00:00Z'
});

test('promptLog lists every commit of the prompt, in the server order', async () => {
	// The bug this guards: after main was rolled back, the Rollback list showed
	// only main's ancestors, so later commits could not be rolled forward to.
	// The server orders children before parents; same-timestamp commits must
	// keep that order rather than be re-sorted by date.
	const s = await fakeServer({ ListCommits: () => ({ commits: [commit('d'), commit('s'), commit('a')] }) });
	try {
		const log = await s.api.promptLog('acme', 'support/agent.prompt');
		assert.deepEqual(log.map((x) => x.hash), ['ddddddd', 'sssssss', 'aaaaaaa']);
		assert.deepEqual(s.calls, [{ method: 'ListCommits', req: { uri: 'priompt://acme/support/agent' } }]);
	} finally {
		s.close();
	}
});

test('branches lists every branch the server has, main first, with its tip', async () => {
	// The bug this guards: the list was fixed to main/dev/staging/prod, so a
	// branch such as feature-x, which the server accepts, was never shown.
	const s = await fakeServer({
		ListBranches: () => ({
			branches: [
				{ name: 'feature-x', commit_hash: 'f'.repeat(64) },
				{ name: 'main', commit_hash: 'a'.repeat(64) }
			]
		}),
		ListCommits: () => ({ commits: [commit('f'), commit('a')] })
	});
	try {
		const bs = await s.api.branches('acme', 'support/agent.prompt');
		assert.deepEqual(bs.map((b) => [b.name, b.lastCommit.hash]), [['main', 'aaaaaaa'], ['feature-x', 'fffffff']]);
	} finally {
		s.close();
	}
});

test('history keeps the subject as the message and the description as the body', async () => {
	const commit = {
		hash: 'a'.repeat(64), version_hash: 'b'.repeat(64), parent: '', parent2: '',
		author: 'ana', message: 'Tighten tone\n\nShorter greeting.', created_at: '2026-10-18T00:00:00Z'
	};
	const s = await fakeServer({ History: () => ({ commits: [commit] }) });
	try {
		const [c] = await s.api.history('acme', 'support/agent.prompt', 'main');
		assert.equal(c.message, 'Tighten tone');
		assert.equal(c.body, 'Shorter greeting.');
	} finally {
		s.close();
	}
});
