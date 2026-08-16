<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Search, FileText } from '@lucide/svelte';
	import { mockPromptContents } from '$lib/mocks';

	const namespace = $derived(page.params.namespace);
	const query = $derived(page.url.searchParams.get('q') ?? '');

	let searchInput = $state(query);

	interface SearchResult {
		path: string;
		matchedLines: { lineNum: number; text: string }[];
		lastCommit: { hash: string; message: string; author: string };
	}

	const results = $derived.by(() => {
		if (!query.trim()) return [];

		const q = query.toLowerCase();
		const matches: SearchResult[] = [];

		for (const [filePath, content] of Object.entries(mockPromptContents)) {
			const lines = content.content.split('\n');
			const matchedLines: { lineNum: number; text: string }[] = [];

			// Check file path match
			const pathMatch = filePath.toLowerCase().includes(q);

			// Check content matches
			for (let i = 0; i < lines.length; i++) {
				if (lines[i].toLowerCase().includes(q)) {
					matchedLines.push({ lineNum: i + 1, text: lines[i] });
					if (matchedLines.length >= 3) break; // Max 3 matched lines per file
				}
			}

			if (pathMatch || matchedLines.length > 0) {
				matches.push({
					path: filePath,
					matchedLines,
					lastCommit: content.lastCommit
				});
			}
		}

		return matches;
	});

	function handleSearch(e: Event) {
		e.preventDefault();
		if (searchInput.trim()) {
			goto(`/${namespace}/search?q=${encodeURIComponent(searchInput.trim())}`);
		}
	}

	function highlightQuery(text: string, q: string): string {
		if (!q.trim()) return escapeHtml(text);
		const escaped = escapeHtml(text);
		const escapedQuery = escapeHtml(q);
		const regex = new RegExp(
			`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
			'gi'
		);
		return escaped.replace(
			regex,
			'<mark class="bg-yellow-500/30 text-yellow-200 rounded px-0.5">$1</mark>'
		);
	}

	function escapeHtml(str: string): string {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
</script>

<svelte:head>
	<title>{query ? `Search: ${query}` : 'Search'} — {namespace} — Priompt</title>
</svelte:head>

<div class="space-y-6">
	<!-- Search header -->
	<div class="border-b border-border pb-4">
		<form onsubmit={handleSearch} class="flex items-center gap-3">
			<div class="relative flex-1">
				<Search
					class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>
				<input
					type="text"
					bind:value={searchInput}
					placeholder="Search prompts, slots, content..."
					class="w-full rounded-md border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>
			<button
				type="submit"
				class="rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
			>
				Search
			</button>
		</form>
	</div>

	<!-- Results -->
	{#if !query.trim()}
		<!-- No query yet -->
		<div class="py-12 text-center">
			<Search class="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
			<p class="text-sm text-muted-foreground">
				Search across all prompts in <span class="font-medium text-foreground">{namespace}</span>
			</p>
			<p class="mt-1 text-xs text-muted-foreground">
				Search by file name, content, slot names, or keywords
			</p>
		</div>
	{:else if results.length === 0}
		<!-- No results -->
		<div class="py-12 text-center">
			<Search class="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
			<p class="text-sm text-foreground">
				No results for "<span class="font-medium">{query}</span>"
			</p>
			<p class="mt-1 text-xs text-muted-foreground">
				Try a different search term or check spelling
			</p>
		</div>
	{:else}
		<!-- Results list -->
		<div>
			<p class="mb-4 text-xs text-muted-foreground">
				{results.length} result{results.length !== 1 ? 's' : ''} for "<span
					class="font-medium text-foreground">{query}</span
				>"
			</p>

			<div class="space-y-3">
				{#each results as result}
					<div class="rounded-md border border-border overflow-hidden">
						<!-- File header -->
						<div
							class="flex items-center gap-2 bg-muted/20 px-4 py-2 border-b border-border"
						>
							<FileText class="h-3.5 w-3.5 text-muted-foreground" />
							<a
								href="/{namespace}/blob/main/{result.path}"
								class="text-sm font-mono text-blue-400 hover:underline"
							>
								{result.path}
							</a>
							<span class="ml-auto text-xs text-muted-foreground">
								{result.lastCommit.message}
							</span>
						</div>

						<!-- Matched lines -->
						{#if result.matchedLines.length > 0}
							<div class="font-mono text-xs">
								{#each result.matchedLines as line}
									<div
										class="flex border-b border-border/50 last:border-b-0 hover:bg-muted/10"
									>
										<span
											class="w-10 shrink-0 select-none border-r border-border/40 px-2 py-1 text-right text-muted-foreground/50"
										>
											{line.lineNum}
										</span>
										<span
											class="px-3 py-1 text-foreground/80 whitespace-pre-wrap break-all"
										>
											{@html highlightQuery(line.text, query)}
										</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
