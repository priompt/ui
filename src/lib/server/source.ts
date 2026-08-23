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

/** Split `main/support/agent.prompt` into its branch and the rest. */
export function splitRef(raw: string): { branch: string; path: string } {
	if (!raw) return { branch: 'main', path: '' };
	const slash = raw.indexOf('/');
	if (slash < 0) return { branch: raw, path: '' };
	return { branch: raw.slice(0, slash), path: raw.slice(slash + 1) };
}
