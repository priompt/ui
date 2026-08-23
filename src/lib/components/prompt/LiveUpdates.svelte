<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	// The pull side of `priompt watch`. An event means "something changed" —
	// the page then re-fetches over the authenticated gRPC path rather than
	// trusting the version or the verdict in the payload.
	let { namespace, path = '' }: { namespace: string; path?: string } = $props();

	let status = $state<'connecting' | 'live' | 'off'>('connecting');
	let last = $state<{ version: string; classification: string } | null>(null);

	onMount(() => {
		const qs = new URLSearchParams({ namespace, ...(path ? { path } : {}) });
		const es = new EventSource(`/api/events?${qs}`);
		es.addEventListener('ready', () => (status = 'live'));
		es.addEventListener('change', (e) => {
			last = JSON.parse((e as MessageEvent).data);
			invalidateAll();
		});
		es.onerror = () => {
			status = 'off';
			es.close();
		};
		return () => es.close();
	});
</script>

{#if status === 'live'}
	<div class="flex items-center gap-2 text-xs text-muted-foreground">
		<span class="relative flex h-2 w-2">
			<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
			<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
		</span>
		Live
		{#if last}
			<span class="font-mono">
				· updated to {last.version.slice(0, 12)}
				{#if last.classification}({last.classification}){/if}
			</span>
		{/if}
	</div>
{/if}
