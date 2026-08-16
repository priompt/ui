<script lang="ts">
	import { FileText, MoreHorizontal } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import type { PromptFile } from '$lib/types';

	interface Props {
		file: PromptFile;
	}

	let { file }: Props = $props();
</script>

<div class="group grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 border-b border-table-border px-4 py-3 transition-colors hover:bg-table-row-hover last:border-b-0">
	<!-- Name column -->
	<div class="flex items-center gap-3">
		<FileText class="h-5 w-5 shrink-0 text-muted-foreground" />
		<a href="/{file.path}" class="text-sm text-link-blue hover:underline">
			{file.name}
		</a>
	</div>

	<!-- Last commit column -->
	<div class="min-w-0 text-sm text-muted-foreground">
		<p class="truncate">{file.lastCommit.message}</p>
		<p class="truncate text-xs">
			<span class="font-mono text-link-blue/80">{file.lastCommit.hash}</span>
			<span class="mx-1">·</span>
			<span>{file.lastCommit.author}</span>
		</p>
	</div>

	<!-- Updated column -->
	<span class="w-24 text-right text-xs text-muted-foreground">{file.updatedAt}</span>

	<!-- Actions -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button
				variant="ghost"
				size="icon"
				class="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
			>
				<MoreHorizontal class="h-4 w-4" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Item>View file</DropdownMenu.Item>
			<DropdownMenu.Item>Edit</DropdownMenu.Item>
			<DropdownMenu.Item>History</DropdownMenu.Item>
			<DropdownMenu.Item>Copy path</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item class="text-destructive">Delete</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
