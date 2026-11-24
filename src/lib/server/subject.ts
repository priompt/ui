/**
 * NATS subjects, built the way the server builds them.
 *
 * `pubsub.Subject` in priompt/priompt turns each URI segment into one subject
 * token and percent-encodes every byte outside [A-Za-z0-9_-]. A "." is legal
 * inside a URI segment but is the NATS token separator, so it has to be encoded
 * or `acme.corp` and `acme/corp` would share a subject. Encoding every other
 * byte also means a name can never smuggle in a wildcard ("*", ">") or extra
 * hierarchy. A subscriber that builds the subject any other way listens on a
 * subject the server never publishes to.
 *
 * Kept free of SvelteKit imports so it can be unit-tested directly.
 */
import { SUFFIX } from './uri.ts';

const encoder = new TextEncoder();

/** Percent-encode every byte outside [A-Za-z0-9_-] as %XX (upper-case hex). */
export function subjectToken(s: string): string {
	let out = '';
	for (const c of encoder.encode(s)) {
		const safe =
			(c >= 0x41 && c <= 0x5a) || // A-Z
			(c >= 0x61 && c <= 0x7a) || // a-z
			(c >= 0x30 && c <= 0x39) || // 0-9
			c === 0x5f || // _
			c === 0x2d; // -
		out += safe ? String.fromCharCode(c) : `%${c.toString(16).toUpperCase().padStart(2, '0')}`;
	}
	return out;
}

/** The subject one prompt is published on: `pubsub.Subject(priompt://org/path)`. */
export function promptSubject(namespace: string, path: string): string {
	const clean = path.endsWith(SUFFIX) ? path.slice(0, -SUFFIX.length) : path;
	return 'priompt.' + [namespace, ...clean.split('/')].map(subjectToken).join('.');
}

/** The wildcard covering every prompt of one org: `pubsub.OrgSubject(org)`. */
export function orgSubject(namespace: string): string {
	return `priompt.${subjectToken(namespace)}.>`;
}

/** The subject for a page: one prompt when it has a path, else the whole org. */
export function subjectFor(namespace: string, path: string): string {
	// promptSubject strips the suffix itself; strip it only to test for an empty
	// path, so `x.prompt.prompt` keeps its inner `.prompt` like the server does.
	const clean = path.endsWith(SUFFIX) ? path.slice(0, -SUFFIX.length) : path;
	return clean ? promptSubject(namespace, path) : orgSubject(namespace);
}
