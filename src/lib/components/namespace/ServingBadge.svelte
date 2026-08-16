<script lang="ts">
	interface Props {
		serving: boolean;
	}

	let { serving }: Props = $props();
</script>

{#if serving}
	<div class="flex items-center gap-2">
		<span class="inline-flex items-center gap-1.5 rounded-full bg-serving-green/10 px-2.5 py-0.5 text-xs font-medium text-serving-green">
			<span class="h-2 w-2 rounded-full bg-serving-green"></span>
			SERVING
		</span>
		<span class="text-sm text-muted-foreground">This branch is being served to agents</span>
	</div>
{/if}
