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
