/**
 * The message a commit is stored with: the summary line, then the commit
 * dialog's extended description after a blank line, the way git writes one.
 */
export function commitMessage(summary: string, description: string): string {
	const body = description.trim();
	return body ? `${summary.trim()}\n\n${body}` : summary.trim();
}

/** The inverse: a stored message's subject line, and the body after it. */
export function splitMessage(message: string): { subject: string; body: string } {
	const [subject, ...rest] = message.split('\n');
	return { subject: subject.trim(), body: rest.join('\n').trim() };
}
