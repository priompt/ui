<script lang="ts">
	// A prototype that silently looks live is how a mock gets mistaken for an
	// integration — which is exactly what happened here before. Say which it is.
	let { live }: { live: boolean } = $props();
</script>

{#if !live}
	<div
		role="status"
		class="border-b border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-200"
	>
		Sample data — no Priompt server configured. Set <code class="font-mono">PRIOMPT_URL</code> to
		connect to a real one.
	</div>
{/if}
