<script lang="ts">
	import { Search } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { mockRecentItems } from '$lib/mocks';

	let filter = $state('');

	const filteredItems = $derived(
		filter
			? mockRecentItems.filter(
					(item) =>
						item.name.toLowerCase().includes(filter.toLowerCase()) ||
						item.org.toLowerCase().includes(filter.toLowerCase())
				)
			: mockRecentItems
	);
</script>

<aside class="w-80 shrink-0 border-r border-border bg-[#0D1117] px-5 pt-6">
	<!-- Header: Recent + New button -->
	<div class="mb-2 flex items-center justify-between">
		<h2 class="text-xs font-semibold text-foreground">Recent</h2>
		<Button size="sm" class="h-6 gap-1 rounded-md bg-[#238636] px-2 text-xs font-medium text-white hover:bg-[#2ea043]">
			<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
			New
		</Button>
	</div>

	<!-- Filter input -->
	<div class="relative mb-3">
		<Search class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
		<Input
			placeholder="Find a prompt..."
			class="h-8 w-full border-border bg-transparent pl-8 text-sm placeholder:text-muted-foreground"
			bind:value={filter}
		/>
	</div>

	<!-- Recent items list -->
	<nav class="flex flex-col">
		{#each filteredItems as item}
			<a
				href={item.path}
				class="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<span class="text-sm">
					{item.org === 'starthackHQ' ? '🔒' : '🌐'}
				</span>
				<span class="truncate text-sm">{item.org}/{item.name}</span>
			</a>
		{/each}

		{#if filteredItems.length === 0}
			<p class="px-1 py-3 text-xs text-muted-foreground">No matching namespaces</p>
		{/if}
	</nav>

	{#if mockRecentItems.length > 7}
		<button class="mt-1 px-1 text-xs text-muted-foreground hover:text-link-blue">
			Show more
		</button>
	{/if}
</aside>
