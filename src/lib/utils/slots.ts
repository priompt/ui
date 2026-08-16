const SLOT_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

export function detectSlots(content: string): string[] {
	const seen = new Set<string>();
	const ordered: string[] = [];
	let match: RegExpExecArray | null;

	// Reset regex lastIndex for safety
	SLOT_REGEX.lastIndex = 0;

	while ((match = SLOT_REGEX.exec(content)) !== null) {
		const name = match[1];
		if (!seen.has(name)) {
			seen.add(name);
			ordered.push(name);
		}
	}

	return ordered;
}
