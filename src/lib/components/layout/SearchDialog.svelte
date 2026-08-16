<script lang="ts">
	import { FileText, Folder, Settings, GitBranch, Search } from '@lucide/svelte';
	import * as Command from '$lib/components/ui/command';
	import { mockRecentItems } from '$lib/mocks';

	let { open = $bindable(false) }: { open: boolean } = $props();
</script>

<Command.Dialog bind:open title="Search" description="Search prompts, namespaces, and commands">
	<Command.Input placeholder="Search or jump to..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>

		<Command.Group heading="Recent">
			{#each mockRecentItems.slice(0, 5) as item}
				<Command.Item
					onSelect={() => {
						open = false;
					}}
				>
					<FileText class="mr-2 h-4 w-4 text-muted-foreground" />
					<span>{item.org}/{item.name}</span>
				</Command.Item>
			{/each}
		</Command.Group>

		<Command.Separator />

		<Command.Group heading="Commands">
			<Command.Item
				onSelect={() => {
					open = false;
				}}
			>
				<Folder class="mr-2 h-4 w-4 text-muted-foreground" />
				<span>Go to namespace...</span>
			</Command.Item>
			<Command.Item
				onSelect={() => {
					open = false;
				}}
			>
				<GitBranch class="mr-2 h-4 w-4 text-muted-foreground" />
				<span>Switch branch...</span>
			</Command.Item>
			<Command.Item
				onSelect={() => {
					open = false;
				}}
			>
				<Settings class="mr-2 h-4 w-4 text-muted-foreground" />
				<span>Settings</span>
			</Command.Item>
		</Command.Group>
	</Command.List>
</Command.Dialog>
