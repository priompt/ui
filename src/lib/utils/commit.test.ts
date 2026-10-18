// Run: pnpm test  (node's built-in runner + type stripping, no framework)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commitMessage, splitMessage } from './commit.ts';

test('the extended description is kept, after a blank line', () => {
	// The bug this guards: the commit dialog collected a description and the
	// edit page dropped it, posting only the summary line.
	assert.equal(commitMessage('Tighten tone', 'Shorter greeting.\nNo emoji.'), 'Tighten tone\n\nShorter greeting.\nNo emoji.');
});

test('no description means just the summary', () => {
	assert.equal(commitMessage('Tighten tone', ''), 'Tighten tone');
	assert.equal(commitMessage('  Tighten tone ', '   \n '), 'Tighten tone');
});

test('a stored message splits back into subject and body', () => {
	// Lists show the subject only; the commit page shows the body under it.
	assert.deepEqual(splitMessage(commitMessage('Tighten tone', 'Shorter greeting.\nNo emoji.')), {
		subject: 'Tighten tone',
		body: 'Shorter greeting.\nNo emoji.'
	});
	assert.deepEqual(splitMessage('one line'), { subject: 'one line', body: '' });
	assert.deepEqual(splitMessage(''), { subject: '', body: '' });
});
