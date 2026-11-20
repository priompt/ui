// Run: pnpm test  (node's built-in runner + type stripping, no framework)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyText } from './clipboard.ts';

const setNavigator = (value: unknown) => {
	Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });
};
const dropDocument = () => {
	delete (globalThis as { document?: unknown }).document;
};

test('uses the Clipboard API when it exists (secure origin)', async () => {
	let written = '';
	setNavigator({ clipboard: { writeText: async (t: string) => { written = t; } } });
	dropDocument();
	assert.equal(await copyText('hello'), true);
	assert.equal(written, 'hello');
});

test('reports failure when the API rejects and no DOM fallback is possible', async () => {
	setNavigator({ clipboard: { writeText: async () => { throw new Error('denied'); } } });
	dropDocument();
	assert.equal(await copyText('hello'), false);
});

test('does not throw when navigator.clipboard is missing (plain-HTTP origin)', async () => {
	setNavigator({});
	dropDocument();
	assert.equal(await copyText('hello'), false);
});

test('falls back to execCommand when the Clipboard API is missing', async () => {
	setNavigator({});
	let command = '';
	let removed = false;
	let selected = false;
	(globalThis as { document?: unknown }).document = {
		createElement: () => ({
			value: '',
			style: {},
			setAttribute: () => {},
			select: () => { selected = true; }
		}),
		body: {
			appendChild: () => {},
			removeChild: () => { removed = true; }
		},
		execCommand: (cmd: string) => { command = cmd; return true; }
	};
	try {
		assert.equal(await copyText('fallback'), true);
		assert.equal(selected, true);
		assert.equal(command, 'copy');
		assert.equal(removed, true);
	} finally {
		dropDocument();
	}
});
