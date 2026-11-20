/**
 * Copy text to the clipboard on every origin.
 *
 * The async Clipboard API only exists in secure contexts (HTTPS or
 * localhost), so a self-hosted deployment served over plain HTTP has no
 * `navigator.clipboard` at all and a direct call throws. Fall back to a
 * temporary textarea + `execCommand('copy')`, which still works there.
 * Returns whether the text ended up on the clipboard so callers can show
 * real feedback instead of assuming success.
 */
export async function copyText(text: string): Promise<boolean> {
	try {
		if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {
		// Permission denied or the document lost focus — try the legacy path.
	}
	try {
		if (typeof document === 'undefined' || !document.body) return false;
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild(textarea);
		textarea.select();
		const ok = document.execCommand('copy');
		document.body.removeChild(textarea);
		return ok;
	} catch {
		return false;
	}
}
