/** "1 prompt", "2 prompts". English-only, like the rest of the UI. */
export function plural(n: number, word: string): string {
	return `${n} ${n === 1 ? word : `${word}s`}`;
}
