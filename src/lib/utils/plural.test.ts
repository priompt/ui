// Run: pnpm test  (node's built-in runner + type stripping, no framework)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plural } from './plural.ts';

test('one is singular, everything else is plural', () => {
	// The bug this guards: "1 prompts", "1 commits ahead", "1 files changed".
	assert.equal(plural(1, 'prompt'), '1 prompt');
	assert.equal(plural(0, 'commit'), '0 commits');
	assert.equal(plural(2, 'file'), '2 files');
});
