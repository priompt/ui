/**
 * The address mapping, kept free of any SvelteKit or transport imports.
 *
 * Priompt stores a flat set of `priompt://<org>/<free-form path>` addresses. The
 * UI presents a tree, and all of that structure is derived from the URIs
 * themselves. Keeping the translation here means nothing else hand-rolls an
 * address — hand-rolled addresses are how malformed ones reached the server —
 * and it means this can be unit-tested without standing up a server or
 * resolving `$env`.
 */
export const SCHEME = 'priompt://';

/**
 * The `.prompt` suffix is a UI affordance so prompts look like files in a tree.
 * It is never part of the address.
 */
export const SUFFIX = '.prompt';

export function toURI(namespace: string, path: string): string {
	const clean = path.endsWith(SUFFIX) ? path.slice(0, -SUFFIX.length) : path;
	return `${SCHEME}${namespace}/${clean}`;
}

export function fromURI(uri: string): { namespace: string; path: string } {
	const rest = uri.startsWith(SCHEME) ? uri.slice(SCHEME.length) : uri;
	const slash = rest.indexOf('/');
	if (slash < 0) return { namespace: rest, path: '' };
	return { namespace: rest.slice(0, slash), path: rest.slice(slash + 1) };
}
