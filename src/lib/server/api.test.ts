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

test('promptLog lists commits from every branch, newest first, not only main', async () => {
	// The bug this guards: after main was rolled back, the Rollback list showed
	// only main's ancestors, so commits still on other branches could not be
	// rolled forward to.
	const c = (h: string, date: string) => ({
		hash: h.repeat(64), version_hash: 'v'.repeat(64), parent: '', parent2: '',
		author: 'ana', message: h, created_at: date
	});
	const root = c('a', '2026-10-01T00:00:00Z');
	const devTip = c('d', '2026-10-03T00:00:00Z');
	const stagingTip = c('s', '2026-10-02T00:00:00Z');
	const logs: Record<string, unknown[]> = { main: [root], dev: [devTip, root], staging: [stagingTip, root] };
	const s = await fakeServer({
		History: (r) => {
			const log = logs[r.branch as string];
			if (!log) throw { code: 5, details: 'branch not found' };
			return { commits: log };
		}
	});
	try {
		const log = await s.api.promptLog('acme', 'support/agent.prompt');
		assert.deepEqual(log.map((x) => x.hash), ['ddddddd', 'sssssss', 'aaaaaaa']);
	} finally {
		s.close();
	}
});
