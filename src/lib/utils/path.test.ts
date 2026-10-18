// Run: pnpm test  (node's built-in runner + type stripping, no framework)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actionUrl } from './path.ts';

test('a form action URL keeps the page query', () => {
	// The bug this guards: Create branch posted to `?/create`, which replaced the
	// query, so the page came back without `?path=` and forgot the prompt.
	const url = new URL(actionUrl('create', { path: 'onboarding/welcome.prompt' }), 'http://ui/acme/branches?path=x');
	assert.equal(url.pathname, '/acme/branches');
	assert.equal(url.searchParams.get('path'), 'onboarding/welcome.prompt');
	// SvelteKit picks the action from the first query key starting with "/".
	assert.deepEqual([...url.searchParams.keys()].filter((k) => k.startsWith('/')), ['/create']);
});

test('with no query it is the plain action', () => {
	assert.equal(actionUrl('create', {}), '?/create');
});
