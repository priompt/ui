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

const tip = (h: string) => ({ commits: [commit(h)] });

test('publishIfCurrent refuses to publish when the branch tip moved since the edit began', async () => {
	// The bug this guards: the editor published onto the tip whatever it was, so a
	// change made from the CLI or another tab after the editor loaded was silently
	// replaced.
	const s = await fakeServer({ History: () => tip('b'), PublishPrompt: () => ({ version_hash: 'v'.repeat(64) }) });
	try {
		const r = await s.api.publishIfCurrent('acme', 'a/b.prompt', 'edit', [], 'msg', 'main', 'a'.repeat(64));
		assert.deepEqual(r, { conflict: true, tip: 'b'.repeat(64) });
		assert.deepEqual(s.calls.map((c) => c.method), ['History']);
		assert.equal(s.calls[0].req.branch, 'main');
	} finally {
		s.close();
	}
});

test('publishIfCurrent publishes when the tip is still the base', async () => {
	const s = await fakeServer({ History: () => tip('a'), PublishPrompt: () => ({ version_hash: 'v'.repeat(64) }) });
	try {
		const r = await s.api.publishIfCurrent('acme', 'a/b.prompt', 'edit', ['x'], 'msg', 'dev', 'a'.repeat(64));
		assert.deepEqual(r, { conflict: false, versionHash: 'v'.repeat(64) });
		assert.deepEqual(s.calls.map((c) => c.method), ['History', 'PublishPrompt']);
		assert.deepEqual(s.calls[1].req, {
			uri: 'priompt://acme/a/b', template: 'edit', slots: ['x'], message: 'msg', branch: 'dev'
		});
	} finally {
		s.close();
	}
});

test('publishNew does not publish over a prompt that already exists', async () => {
	// The bug this guards: "New prompt" published straight onto the address, so
	// reusing a name replaced the live prompt on main with no warning.
	const s = await fakeServer({
		GetPrompt: () => ({ uri: 'priompt://acme/onboarding/welcome', template: 'old', slots: [], version_hash: 'v'.repeat(64) }),
		PublishPrompt: () => ({ version_hash: 'v'.repeat(64) })
	});
	try {
		const r = await s.api.publishNew('acme', 'onboarding/welcome.prompt', 'new', [], 'msg');
		assert.deepEqual(r, { created: false, uri: 'priompt://acme/onboarding/welcome' });
		assert.deepEqual(s.calls.map((c) => c.method), ['GetPrompt']);
	} finally {
		s.close();
	}
});

test('publishNew publishes at a free address', async () => {
	const s = await fakeServer({
		GetPrompt: () => { throw { code: 5, details: 'prompt not found' }; },
		PublishPrompt: () => ({ version_hash: 'v'.repeat(64) })
	});
	try {
		const r = await s.api.publishNew('acme', 'onboarding/fresh.prompt', 'hello', [], 'msg');
		assert.deepEqual(r, { created: true, versionHash: 'v'.repeat(64) });
		assert.deepEqual(s.calls.map((c) => c.method), ['GetPrompt', 'PublishPrompt']);
	} finally {
		s.close();
	}
});

test('publishNew does not publish when the existence check fails for another reason', async () => {
	const s = await fakeServer({
		GetPrompt: () => { throw { code: 14, details: 'backend down' }; },
		PublishPrompt: () => ({ version_hash: 'v'.repeat(64) })
	});
	try {
		await assert.rejects(s.api.publishNew('acme', 'a/b.prompt', 'x', [], 'msg'), { code: 'unavailable' });
		assert.deepEqual(s.calls.map((c) => c.method), ['GetPrompt']);
	} finally {
		s.close();
	}
});
