// Run: pnpm test  (node's built-in runner + type stripping, no framework)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unifiedDiff, worstVerdict, parseDiff, type SemanticChange } from './diff.ts';

const change = (o1: number, o2: number, n1: number, n2: number, cls = 'minor edit') =>
	({ oldStart: o1, oldEnd: o2, newStart: n1, newEnd: n2, classification: cls }) as SemanticChange;

test('no changes renders nothing', () => {
	assert.equal(unifiedDiff('a\nb', 'a\nb', []), '');
});

test('one replaced line', () => {
	const d = unifiedDiff('hi there\ntail', 'hey there\ntail', [change(0, 1, 0, 1)]);
	assert.deepEqual(d.split('\n'), ['@@ -1,2 +1,2 @@', '-hi there', '+hey there', ' tail']);
});

test('two changes sharing context are one hunk, printed once', () => {
	// The bug this guards: a hunk per change re-printed the overlapping lines.
	const before = 'one\ntwo\nthree\nfour';
	const after = 'ONE\ntwo\nthree\nFOUR';
	const d = unifiedDiff(before, after, [change(0, 1, 0, 1), change(3, 4, 3, 4)]);

	assert.equal(d.match(/^@@/gm)?.length, 1, 'exactly one hunk header');
	assert.equal(d.match(/^ two$/gm)?.length, 1, 'context line printed once');
	assert.deepEqual(d.split('\n'), [
		'@@ -1,4 +1,4 @@',
		'-one',
		'+ONE',
		' two',
		' three',
		'-four',
		'+FOUR'
	]);
});

test('insert and delete keep both sides aligned', () => {
	const d = unifiedDiff('a\nb', 'a\nnew\nb', [change(1, 1, 1, 2)]);
	assert.deepEqual(d.split('\n'), ['@@ -1,2 +1,3 @@', ' a', '+new', ' b']);
});

test('output round-trips through parseDiff', () => {
	const d = unifiedDiff('hi there\ntail', 'hey there\ntail', [change(0, 1, 0, 1)]);
	const lines = parseDiff(d);
	assert.deepEqual(
		lines.map((l) => l.type),
		['header', 'removed', 'added', 'context']
	);
	assert.equal(lines[1].content, 'hi there');
	assert.equal(lines[2].content, 'hey there');
});

test('worstVerdict reports the strongest classification', () => {
	assert.equal(worstVerdict([]), undefined);
	assert.equal(
		worstVerdict([change(0, 1, 0, 1, 'minor edit'), change(2, 3, 2, 3, 'structural')]),
		'structural'
	);
	assert.equal(
		worstVerdict([change(0, 1, 0, 1, 'localized tweak'), change(2, 3, 2, 3, 'minor edit')]),
		'localized tweak'
	);
});
