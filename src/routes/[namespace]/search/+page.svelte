<script lang="ts">
	import { Search } from '@lucide/svelte';

	let { data } = $props();
	let query = $state(data.query);
</script>

<svelte:head><title>Search — {data.namespace} — Priompt</title></svelte:head>

<div class="space-y-4">
	<h1 class="text-lg font-semibold text-foreground">Search {data.namespace}</h1>

	<form method="GET" class="flex gap-2">
		<div class="relative flex-1">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<input
				name="q"
				bind:value={query}
				placeholder="Search prompt paths and content…"
				class="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground"
			/>
		</div>
	</form>

	{#if data.error}
		<p role="alert" class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{data.error}</p>
	{/if}

	{#if data.query}
		<p class="text-xs text-muted-foreground">
			{data.hits.length} result{data.hits.length === 1 ? '' : 's'}
			{#if data.live}· scanned {data.scanned} prompt{data.scanned === 1 ? '' : 's'}{/if}
		</p>

		{#if data.truncated}
			<!-- Say what was skipped. The API has no search RPC, so matching content
			     means fetching prompts and scanning them here; a silent cap would
			     read as "no more matches" when it means "stopped looking". -->
			<p class="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
				Only the first {data.limit} prompts were scanned. Content search runs client-side because
				the server has no search RPC — an indexed search needs one.
			</p>
		{/if}

		<div class="rounded-lg border border-border bg-card">
			{#each data.hits as hit}
				<a
					href="/{data.namespace}/blob/main/{hit.path}"
					class="block border-b border-border/60 px-4 py-3 last:border-b-0 hover:bg-muted/40"
				>
					<div class="font-mono text-sm text-link-blue">{hit.path}</div>
					{#if hit.matchedContent}
						<div class="mt-1 font-mono text-xs text-muted-foreground">
							line {hit.line}: {hit.text}
						</div>
					{/if}
				</a>
			{:else}
				<p class="px-4 py-6 text-sm text-muted-foreground">No prompts matched.</p>
			{/each}
		</div>
	{/if}
</div>
