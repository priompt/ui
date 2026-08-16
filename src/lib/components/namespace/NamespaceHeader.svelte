<script lang="ts">
	import { Lock } from '@lucide/svelte';

	interface Props {
		name: string;
		visibility?: 'public' | 'private';
		subtitle?: string;
	}

	let { name, visibility = 'private', subtitle = 'Prompt namespace' }: Props = $props();
</script>

<div class="mb-4">
	<div class="flex items-center gap-2">
		<Lock class="h-4 w-4 text-muted-foreground" />
		<h1 class="text-2xl font-semibold text-foreground">{name}</h1>
		{#if visibility === 'private'}
			<Lock class="h-3.5 w-3.5 text-muted-foreground" />
		{/if}
	</div>
	<p class="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
</div>
