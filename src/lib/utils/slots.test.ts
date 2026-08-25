// Run: pnpm test  (node's built-in runner + type stripping, no framework)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectSlots, validateTemplate } from './slots.ts';

test('slots are single-brace and detected in order, without duplicates', () => {
	assert.deepEqual(detectSlots('Hi {name}, welcome to {org}. Bye {name}.'), ['name', 'org']);
	assert.deepEqual(detectSlots('No slots here.'), []);
});

// The bug this guards: the editor taught {{name}}, which the server's validator
// still matched as the inner {name} — so the prompt published and then silently
// failed to interpolate, because str.format reads "{{" as an escaped brace.
test('doubled braces are rejected, not silently accepted', () => {
	const err = validateTemplate('You are an agent for {{company_name}}.');
	assert.ok(err, 'doubled braces must be rejected');
	assert.match(err!, /\{company_name\}/, 'the message shows the correct form');

	// detectSlots deliberately still finds the inner {company_name} here — it
	// mirrors the server's own regex, which does the same. That permissiveness
	// is the whole reason the bug was silent: the prompt validated, published,
	// and then interpolated nothing. So the guarantee lives in validateTemplate
	// refusing it up front, not in detection quietly ignoring it.
	assert.deepEqual(detectSlots('Agent for {{company_name}}.'), ['company_name']);
});

test('unclosed and malformed placeholders are rejected', () => {
	assert.ok(validateTemplate('Hello {name, welcome.'), 'unclosed brace');
	assert.ok(validateTemplate('Hello {}.'), 'empty placeholder');
	assert.ok(validateTemplate('Hello {na me}.'), 'space inside a placeholder');
});

test('empty and whitespace-only templates are rejected', () => {
	assert.ok(validateTemplate(''), 'empty');
	assert.ok(validateTemplate('   \n\n'), 'whitespace only');
});

test('a multi-line template is scanned in full, not just its first line', () => {
	assert.ok(validateTemplate('line one is fine\nline two has {oops\n'), 'later line');
	assert.equal(validateTemplate('Hi {name},\nwelcome to {org}.\n'), null, 'valid multi-line');
});
