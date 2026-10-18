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

test('branches lists any branch it is told about, not only the four conventional names', async () => {
	// The bug this guards: the list was fixed to main/dev/staging/prod, so a
	// branch such as feature-x, which the server accepts, could never be shown.
	const commit = {
		hash: 'a'.repeat(64), version_hash: 'b'.repeat(64), parent: '', parent2: '',
		author: 'ana', message: 'x', created_at: '2026-10-18T00:00:00Z'
	};
	const s = await fakeServer({
		History: (r) => {
			if (r.branch === 'main' || r.branch === 'feature-x') return { commits: [commit] };
			throw { code: 5, details: 'branch not found' };
		}
	});
	try {
		const bs = await s.api.branches('acme', 'support/agent.prompt', ['feature-x', 'main', 'missing']);
		assert.deepEqual(bs.map((b) => b.name), ['main', 'feature-x']);
	} finally {
		s.close();
	}
});
