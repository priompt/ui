/**
 * Live server or fixtures, decided once.
 *
 * The UI still has to run with nothing behind it — that is how it is developed,
 * and how the design work happens. So every loader asks here rather than
 * assuming. When no server is configured the fixtures load exactly as before and
 * the layout shows a banner saying so, because a demo that silently looks live
 * is how a prototype gets mistaken for an integration.
 */
export { isLive, PriomptError } from './client';
import { PriomptError as PErr } from './client';

/**
 * gRPC status -> HTTP status, in one place.
 *
 * "The backend is down" is not "this prompt does not exist", and rendering the
 * second for the first sends people looking for a prompt they never deleted.
 * UNAVAILABLE and ABORTED are retryable and must say so in the status line.
 */
export function httpStatus(e: unknown): number {
	const err = e as PErr;
	switch (err?.code) {
		case 'permission_denied':
			return 403;
		case 'unauthenticated':
			return 401;
		case 'invalid_argument':
			return 400;
		case 'unavailable':
			return 503;
		case 'aborted':
			return 409;
		case 'not_found':
			return 404;
		default:
			return 500;
	}
}

/** Split `main/support/agent.prompt` into its branch and the rest. */
export function splitRef(raw: string): { branch: string; path: string } {
	if (!raw) return { branch: 'main', path: '' };
	const slash = raw.indexOf('/');
	if (slash < 0) return { branch: raw, path: '' };
	return { branch: raw.slice(0, slash), path: raw.slice(slash + 1) };
}
