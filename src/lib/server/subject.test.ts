// Run: pnpm test
// The expected values mirror internal/pubsub/subject_test.go in priompt/priompt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orgSubject, promptSubject, subjectFor, subjectToken } from './subject.ts';

test('a dot-free prompt keeps its readable subject', () => {
	assert.equal(promptSubject('acme', 'onboarding/welcome.prompt'), 'priompt.acme.onboarding.welcome');
	assert.equal(promptSubject('acme', 'support/agent-v2_x'), 'priompt.acme.support.agent-v2_x');
});

test('dots in the org or the path are percent-encoded, as the server does', () => {
	assert.equal(promptSubject('acme.corp', 'x/a.b'), 'priompt.acme%2Ecorp.x.a%2Eb');
	assert.equal(promptSubject('acme', 'support/triage.v2.prompt'), 'priompt.acme.support.triage%2Ev2');
});

test('distinct prompts get distinct subjects', () => {
	assert.notEqual(promptSubject('acme', 'a.b'), promptSubject('acme', 'a/b'));
	assert.notEqual(promptSubject('acme', 'corp/x'), promptSubject('acme.corp', 'x'));
});

test('the org subject encodes the org like the first token of a prompt subject', () => {
	assert.equal(orgSubject('acme.corp'), 'priompt.acme%2Ecorp.>');
	assert.equal(orgSubject('acme'), 'priompt.acme.>');
	// "priompt.acme.>" must not cover org "acme.corp".
	assert.ok(!promptSubject('acme.corp', 'x').startsWith('priompt.acme.'));
});

test('wildcards and other bytes cannot be smuggled into a subject', () => {
	assert.equal(subjectToken('*'), '%2A');
	assert.equal(subjectToken('>'), '%3E');
	assert.equal(subjectToken(' a'), '%20a');
	// Multi-byte characters encode per UTF-8 byte, like the Go and JS SDKs.
	assert.equal(subjectToken('é'), '%C3%A9');
	assert.equal(promptSubject('acme', '*/>'), 'priompt.acme.%2A.%3E');
});

test('subjectFor picks the prompt subject with a path and the org subject without', () => {
	assert.equal(subjectFor('acme.corp', 'x/a.b.prompt'), 'priompt.acme%2Ecorp.x.a%2Eb');
	assert.equal(subjectFor('acme.corp', ''), 'priompt.acme%2Ecorp.>');
});

test('a bare .prompt path falls back to the org subject', () => {
	assert.equal(subjectFor('acme', '.prompt'), 'priompt.acme.>');
});
