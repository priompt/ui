// Slots are written {name} — single braces. This is the one syntax the whole
// system uses: priomptproto/validate matches /\{(\w+)\}/ on write and on serve,
// promptctl reads slots the same way, and both SDK READMEs interpolate with
// Python's str.format.
//
// It matters that this file agrees with them. When the editor taught {{name}},
// a prompt authored here still passed server validation — the validator found
// the inner {name} — and then silently failed to interpolate, because str.format
// reads "{{" as an escaped literal brace. The agent received the text
// "{company_name}" in its system prompt, with nothing raised and nothing logged.
const SLOT_REGEX = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

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

/**
 * Validate a prompt body against the same rules the server enforces, so the
 * editor refuses what a publish would refuse instead of saving it and finding
 * out later. Returns null when the template is valid.
 */
export function validateTemplate(content: string): string | null {
	if (!content.trim()) {
		return 'A prompt cannot be empty.';
	}

	const doubled = content.match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/);
	if (doubled) {
		return `Write {${doubled[1]}}, not {{${doubled[1]}}}. Doubled braces are an escaped literal brace, so the slot would never be filled in.`;
	}

	for (let i = 0; i < content.length; i++) {
		if (content[i] !== '{') continue;
		let j = i + 1;
		while (j < content.length && /[a-zA-Z0-9_]/.test(content[j])) j++;
		if (j >= content.length || content[j] !== '}' || j === i + 1) {
			const near = content.slice(i, i + 24);
			return `Unclosed or malformed placeholder near "${near}". Slots look like {name}.`;
		}
		i = j;
	}

	return null;
}
