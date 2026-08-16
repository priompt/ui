<script lang="ts">
	import type { PromptFile, CommitSummary } from '$lib/types';
	import FolderRow from './FolderRow.svelte';
	import FileRow from './FileRow.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { History } from '@lucide/svelte';

	interface Props {
		files: PromptFile[];
		namespace?: string;
		branch?: string;
		latestCommit?: CommitSummary;
	}

	let { files, namespace = '', branch = '', latestCommit }: Props = $props();

	const sortedFiles = $derived(
		[...files].sort((a, b) => {
			if (a.type === b.type) return a.name.localeCompare(b.name);
			return a.type === 'folder' ? -1 : 1;
		})
	);
</script>

<div class="overflow-hidden rounded-lg border border-border">
	<!-- Commit header row (like GitHub) -->
	{#if latestCommit}
		<div class="flex items-center justify-between border-b border-border bg-[#161b22] px-4 py-2.5">
			<div class="flex items-center gap-2.5 min-w-0">
				<Avatar.Root class="h-5 w-5 shrink-0">
					<Avatar.Fallback class="text-[10px]">{latestCommit.author[0]}</Avatar.Fallback>
				</Avatar.Root>
				<span class="text-sm font-medium text-foreground shrink-0">{latestCommit.author}</span>
				<a href="/{namespace}/commits/{branch}" class="truncate text-sm text-muted-foreground hover:text-link-blue hover:underline">
					{latestCommit.message}
				</a>
			</div>
			<div class="flex items-center gap-3 shrink-0 ml-4">
				<a href="/{namespace}/commit/{latestCommit.hash}" class="font-mono text-xs text-link-blue hover:underline">{latestCommit.hash}</a>
				<span class="text-xs text-muted-foreground">{files[0]?.updatedAt ?? ''}</span>
				<a href="/{namespace}/commits/{branch}" class="flex items-center gap-1 text-xs text-muted-foreground hover:text-link-blue">
					<History class="h-3 w-3" />
					<span>History</span>
				</a>
			</div>
		</div>
	{/if}

	<!-- File rows -->
	{#each sortedFiles as file}
		{#if file.type === 'folder'}
			<FolderRow {file} {namespace} {branch} />
		{:else}
			<FileRow {file} {namespace} {branch} />
		{/if}
	{/each}
</div>
