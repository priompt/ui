// Run: pnpm test  (node's built-in runner + type stripping, no framework)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toURI, fromURI, SUFFIX } from './uri.ts';

// The URI is the authorization boundary — its first segment is the org — and it
// is also mapped onto a NATS subject and onto a filesystem path by the CLI. So
// this mapping is a security surface, not a formatting detail.
test('a UI path becomes a prompt address, dropping the .prompt affordance', () => {
	assert.equal(toURI('acme', 'support/agent.prompt'), 'priompt://acme/support/agent');
	assert.equal(toURI('acme', 'support/agent'), 'priompt://acme/support/agent');
	assert.equal(toURI('acme', 'greeting.prompt'), 'priompt://acme/greeting');
});

test('an address becomes a namespace and a path', () => {
	assert.deepEqual(fromURI('priompt://acme/support/agent'), {
		namespace: 'acme',
		path: 'support/agent'
	});
	assert.deepEqual(fromURI('priompt://acme'), { namespace: 'acme', path: '' });
});

test('round-trips at any depth', () => {
	for (const p of ['a/b', 'a/b/c/d/e', 'support/tier1/greeting']) {
		const { namespace, path } = fromURI(toURI('acme', p + SUFFIX));
		assert.equal(namespace, 'acme');
		assert.equal(path, p);
	}
});

// The prefix-boundary bug at the mapping layer: "acme" must never be read as the
// org of "acmecorp/...". Authorization compares this parsed value, not a prefix.
test('org parsing stops at the separator', () => {
	assert.equal(fromURI('priompt://acmecorp/c/z').namespace, 'acmecorp');
	assert.notEqual(
		fromURI('priompt://acmecorp/c/z').namespace,
		fromURI('priompt://acme/a/x').namespace
	);
});
