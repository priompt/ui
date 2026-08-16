<script lang="ts">
	import type { PromptFile } from '$lib/types';
	import FolderRow from './FolderRow.svelte';
	import FileRow from './FileRow.svelte';

	interface Props {
		files: PromptFile[];
	}

	let { files }: Props = $props();

	// Sort: folders first, then files, alphabetical within each group
	const sortedFiles = $derived(
		[...files].sort((a, b) => {
			if (a.type === b.type) return a.name.localeCompare(b.name);
			return a.type === 'folder' ? -1 : 1;
		})
	);
</script>

<div class="overflow-hidden rounded-lg border border-table-border">
	<!-- Table header -->
	<div class="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 border-b border-table-border bg-card/30 px-4 py-2.5 text-xs font-medium text-muted-foreground">
		<span>Name</span>
		<span>Last commit</span>
		<span class="w-24 text-right">Updated</span>
		<span class="w-8"></span>
	</div>

	<!-- Rows -->
	{#each sortedFiles as file}
		{#if file.type === 'folder'}
			<FolderRow {file} />
		{:else}
			<FileRow {file} />
		{/if}
	{/each}
</div>
