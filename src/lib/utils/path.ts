import type { Branch, BreadcrumbItem } from '$lib/types';

/**
 * Parse a raw URL path into a branch and folder path using greedy longest-prefix matching.
 * This handles branch names containing `/` characters (e.g., `feature/auth`).
 */
export function parseBranchAndPath(
	rawPath: string,
	branches: Branch[]
): { branch: Branch | null; folderPath: string } {
	if (!rawPath) return { branch: null, folderPath: '' };

	const segments = rawPath.split('/');

	// Try longest-prefix match against known branch names
	for (let i = segments.length; i >= 1; i--) {
		const candidateBranch = segments.slice(0, i).join('/');
		const matched = branches.find((b) => b.name === candidateBranch);
		if (matched) {
			return {
				branch: matched,
				folderPath: segments.slice(i).join('/')
			};
		}
	}

	// Fallback: no branch matched
	return { branch: null, folderPath: segments.slice(1).join('/') };
}

/**
 * Build breadcrumb navigation items from namespace, branch, and path segments.
 * Collapses middle segments with an overflow indicator when there are more than 5 segments.
 */
export function buildBreadcrumbSegments(
	namespace: string,
	branch: string,
	pathSegments: string[]
): BreadcrumbItem[] {
	const items: BreadcrumbItem[] = [{ label: namespace, href: `/${namespace}/tree/${branch}` }];

	if (pathSegments.length <= 5) {
		pathSegments.forEach((seg, i) => {
			const isLast = i === pathSegments.length - 1;
			const path = pathSegments.slice(0, i + 1).join('/');
			items.push({
				label: seg,
				href: isLast ? undefined : `/${namespace}/tree/${branch}/${path}`
			});
		});
	} else {
		// Collapse: namespace + "…" + last 3 segments
		items.push({ label: '\u2026', isOverflow: true });
		const lastThree = pathSegments.slice(-3);
		const offset = pathSegments.length - 3;
		lastThree.forEach((seg, i) => {
			const isLast = i === 2;
			const path = pathSegments.slice(0, offset + i + 1).join('/');
			items.push({
				label: seg,
				href: isLast ? undefined : `/${namespace}/tree/${branch}/${path}`
			});
		});
	}

	return items;
}

/**
 * Parse a compare spec string in `base...head` format.
 * Returns the base and head branch names, or null if the format is invalid.
 */
export function parseCompareSpec(spec: string): { base: string; head: string } | null {
	const parts = spec.split('...');
	if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
	return { base: parts[0], head: parts[1] };
}
