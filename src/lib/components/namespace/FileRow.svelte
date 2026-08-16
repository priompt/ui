<script lang="ts">
	import { goto } from '$app/navigation';
	import { FileText, MoreHorizontal } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import type { PromptFile } from '$lib/types';

	interface Props {
		file: PromptFile;
		namespace?: string;
		branch?: string;
	}

	let { file, namespace = '', branch = '' }: Props = $props();
</script>

<div class="group flex items-center gap-4 border-b border-border px-4 py-2 transition-colors hover:bg-[#1c2128] last:border-b-0">
	<!-- Icon + Name -->
	<div class="flex items-center gap-3 w-65 shrink-0">
		<FileText class="h-4 w-4 shrink-0 text-muted-foreground" />
		<a href="/{namespace}/blob/{branch}/{file.path}" class="text-sm text-link-blue hover:underline">
			{file.name}
		</a>
	</div>

	<!-- Commit message -->
	<div class="flex-1 min-w-0">
		<a href="/{namespace}/commit/{file.lastCommit.hash}" class="truncate block text-sm text-muted-foreground hover:text-link-blue hover:underline">
			{file.lastCommit.message}
		</a>
	</div>

	<!-- Relative time -->
	<span class="text-xs text-muted-foreground shrink-0 w-24 text-right">{file.updatedAt}</span>

	<!-- Overflow menu -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button
				variant="ghost"
				size="icon"
				class="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
			>
				<MoreHorizontal class="h-3.5 w-3.5" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Item onSelect={() => goto(`/${namespace}/blob/${branch}/${file.path}`)}>View file</DropdownMenu.Item>
			<DropdownMenu.Item onSelect={() => goto(`/${namespace}/edit/${branch}/${file.path}`)}>Edit</DropdownMenu.Item>
			<DropdownMenu.Item onSelect={() => goto(`/${namespace}/commits/${branch}/${file.path}`)}>History</DropdownMenu.Item>
			<DropdownMenu.Item onSelect={() => navigator.clipboard.writeText(file.path)}>Copy path</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item class="text-destructive">Delete</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
