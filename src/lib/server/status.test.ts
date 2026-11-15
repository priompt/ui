// Run: pnpm test  (node's built-in runner + type stripping, no framework)
// The gRPC status table is the only translation from server-side failures to
// HTTP semantics, so every entry is pinned here: a wrong name hides the cause,
// a wrong HTTP code turns "rate limited" into "server bug", and a wrong
// retryability hides whether the user can safely repeat the write.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakeServer, loadApi } from './api-harness.ts';

// [gRPC code, name, HTTP status, retryable]
const STATUSES: Array<[number, string, number, boolean]> = [
	[1, 'cancelled', 499, true],
	[4, 'deadline_exceeded', 504, true],
	[6, 'already_exists', 409, false],
	[8, 'resource_exhausted', 429, true],
	[9, 'failed_precondition', 412, false],
	[12, 'unimplemented', 501, false],
	[13, 'internal', 500, false],
	[15, 'data_loss', 500, false]
];

test('gRPC failures keep their status name, HTTP code and retryability', async () => {
	let failure: unknown;
	const s = await fakeServer({
		History: () => {
			throw failure;
		}
	});
	try {
		// Loaded after the harness registers its module hooks.
		const { PriomptError } = await import('./client.ts');
		const { httpStatus } = await import('./source.ts');

		for (const [code, name, http, retryable] of STATUSES) {
			failure = { code, details: `gRPC ${code}` };
			const err = await s.api.history('acme', 'support/agent.prompt', 'main').then(
				() => {
					throw new Error(`expected gRPC ${code} to reject`);
				},
				(e: unknown) => e as InstanceType<typeof PriomptError>
			);
			assert.ok(err instanceof PriomptError, `gRPC ${code} rejects with PriomptError`);
			assert.equal(err.code, name, `gRPC ${code} name`);
			assert.equal(err.retryable, retryable, `gRPC ${code} retryable`);
			assert.equal(httpStatus(err), http, `gRPC ${code} HTTP status`);
		}
	} finally {
		s.close();
	}
});

test('unknown gRPC codes fall back to internal / 500 / not retryable', async () => {
	const s = await fakeServer({
		History: () => {
			throw { code: 99, details: 'mystery failure' };
		}
	});
	try {
		const { httpStatus } = await import('./source.ts');
		const err = await s.api.history('acme', 'support/agent.prompt', 'main').then(
			() => {
				throw new Error('expected rejection');
			},
			(e: unknown) => e as { code: string; retryable: boolean }
		);
		assert.equal(err.code, 'internal');
		assert.equal(err.retryable, false);
		assert.equal(httpStatus(err), 500);
	} finally {
		s.close();
	}
});

test('CODE_NAMES covers all 16 canonical gRPC codes', async () => {
	await loadApi();
	const { CODE_NAMES } = await import('./client.ts');
	const canonical = [
		'ok',
		'cancelled',
		'unknown',
		'invalid_argument',
		'deadline_exceeded',
		'not_found',
		'already_exists',
		'permission_denied',
		'resource_exhausted',
		'failed_precondition',
		'aborted',
		'out_of_range',
		'unimplemented',
		'internal',
		'unavailable',
		'data_loss',
		'unauthenticated'
	];
	assert.deepEqual(
		Object.keys(CODE_NAMES).map(Number).sort((a, b) => a - b),
		canonical.map((_, i) => i)
	);
	canonical.forEach((name, code) => assert.equal(CODE_NAMES[code], name, `gRPC ${code}`));
});
