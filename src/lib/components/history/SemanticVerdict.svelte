<script lang="ts">
	// The Semantic Propagation Diff, rendered.
	//
	// This is the thing Priompt exists to produce and the one signal this UI never
	// showed: the commit view had a plain text diff and a fixture "AI summary",
	// while the server had already computed a verdict on every publish. A reviewer
	// looking at a prompt change needs to know whether the meaning rippled, not
	// just which characters moved.
	interface Window { radius: number; delta: number }
	interface Change {
		old_start: number; old_end: number; new_start: number; new_end: number;
		kind: string; point_delta: number;
		up: Window[]; down: Window[];
		up_boundary: boolean; down_boundary: boolean;
		classification: string;
	}

	let { changes, verdict }: { changes: Change[]; verdict: string } = $props();

	const tone = (c: string) =>
		c === 'structural'
			? 'border-red-500/40 bg-red-500/10 text-red-300'
			: c === 'localized tweak'
				? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
				: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';

	const pct = (d: number) => `${Math.round(d * 100)}%`;
	const curve = (ws: Window[], boundary: boolean) =>
		ws.length === 0
			? '—'
			: ws.map((w) => `±${w.radius}=${w.delta.toFixed(3)}`).join(' ') +
				(boundary ? ' (boundary)' : ' (flat)');
</script>

{#if changes.length > 0}
	<section class="rounded-lg border border-border bg-card p-4">
		<div class="mb-3 flex items-center gap-2">
			<h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Semantic propagation diff
			</h3>
			{#if verdict}
				<span class="rounded border px-2 py-0.5 font-mono text-xs {tone(verdict)}">{verdict}</span>
			{/if}
		</div>

		{#if verdict === 'structural'}
			<p class="mb-3 text-sm text-red-300">
				The meaning shift reaches the edge of the prompt. Review this before it serves.
			</p>
		{/if}

		<div class="space-y-3">
			{#each changes as c}
				<div class="rounded border border-border/60 bg-muted/30 p-3">
					<div class="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
						<span class="font-mono text-xs text-foreground">
							{c.kind} @ new {c.new_start + 1}–{c.new_end} (old {c.old_start + 1}–{c.old_end})
						</span>
						<span class="rounded border px-1.5 font-mono text-[11px] {tone(c.classification)}">
							{c.classification}
						</span>
					</div>
					<dl class="grid gap-1 font-mono text-[11px] text-muted-foreground sm:grid-cols-[10rem_1fr]">
						<dt>Signal 2 — at the point</dt>
						<dd class="text-foreground">{c.point_delta.toFixed(3)} ({pct(c.point_delta)})</dd>
						<dt>Signal 3 — upward</dt>
						<dd>{curve(c.up, c.up_boundary)}</dd>
						<dt>Signal 3 — downward</dt>
						<dd>{curve(c.down, c.down_boundary)}</dd>
					</dl>
				</div>
			{/each}
		</div>
	</section>
{/if}
