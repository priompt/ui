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
