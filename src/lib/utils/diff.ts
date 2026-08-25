import type { DiffLine } from '$lib/types';

export function parseDiff(diffStr: string): DiffLine[] {
	if (!diffStr) return [];

	const lines = diffStr.split('\n');
	const result: DiffLine[] = [];
	let oldLine = 0;
	let newLine = 0;

	for (const line of lines) {
		if (line.startsWith('@@')) {
			// Parse hunk header: @@ -oldStart,oldCount +newStart,newCount @@
			const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
			if (match) {
				oldLine = parseInt(match[1], 10);
				newLine = parseInt(match[2], 10);
			}
			result.push({ type: 'header', content: line });
		} else if (line.startsWith('---') || line.startsWith('+++')) {
			result.push({ type: 'header', content: line });
		} else if (line.startsWith('+')) {
			result.push({ type: 'added', content: line.slice(1), newLineNum: newLine++ });
		} else if (line.startsWith('-')) {
			result.push({ type: 'removed', content: line.slice(1), oldLineNum: oldLine++ });
		} else {
			// Context line (starts with space or is empty)
			result.push({
				type: 'context',
				content: line.startsWith(' ') ? line.slice(1) : line,
				oldLineNum: oldLine++,
				newLineNum: newLine++
			});
		}
	}

	return result;
}

/** One hunk as the server's DiffCommits/DiffPrompt reports it. */
export interface SemanticChange {
	oldStart: number;
	oldEnd: number;
	newStart: number;
	newEnd: number;
	classification: string;
}

/**
 * Render a unified diff from the hunks the server already computed. No diff
 * algorithm here on purpose: the server returns exact line ranges, so this only
 * has to lay them out in the format parseDiff() above reads back.
 *
 * ponytail: one hunk spanning all changes. Prompts are short enough that
 * splitting would only add noise — and emitting a hunk per change double-prints
 * the lines where two changes share context.
 */
export function unifiedDiff(
	oldText: string,
	newText: string,
	changes: SemanticChange[],
	ctx = 3
): string {
	if (!changes.length) return '';

	const o = oldText.split('\n');
	const n = newText.split('\n');
	const sorted = [...changes].sort((a, b) => a.oldStart - b.oldStart);
	const last = sorted[sorted.length - 1];

	const oFrom = Math.max(0, sorted[0].oldStart - ctx);
	const nFrom = Math.max(0, sorted[0].newStart - ctx);
	const oTo = Math.min(o.length, last.oldEnd + ctx);
	const nTo = Math.min(n.length, last.newEnd + ctx);

	const out = [`@@ -${oFrom + 1},${oTo - oFrom} +${nFrom + 1},${nTo - nFrom} @@`];
	let oi = oFrom;
	let ni = nFrom;

	for (const c of sorted) {
		// lines between two changes are unchanged, so both sides advance together
		while (oi < c.oldStart) {
			out.push(' ' + o[oi]);
			oi++;
			ni++;
		}
		for (; oi < c.oldEnd; oi++) out.push('-' + o[oi]);
		for (; ni < c.newEnd; ni++) out.push('+' + n[ni]);
	}
	while (oi < oTo && ni < nTo) {
		out.push(' ' + o[oi]);
		oi++;
		ni++;
	}
	return out.join('\n');
}

/** The strongest verdict across a commit's hunks — that's the one to act on. */
export function worstVerdict(changes: SemanticChange[]): string | undefined {
	const rank = ['minor edit', 'localized tweak', 'structural'];
	let worst = -1;
	for (const c of changes) worst = Math.max(worst, rank.indexOf(c.classification));
	return worst >= 0 ? rank[worst] : undefined;
}
