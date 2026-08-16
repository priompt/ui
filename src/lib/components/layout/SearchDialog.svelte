<script lang="ts">
	import { FileText, Folder, GitBranch, Settings } from '@lucide/svelte';
	import * as Command from '$lib/components/ui/command';
	import {
		mockNamespaces,
		mockAcmeFiles,
		mockFolderContents,
		mockBranches,
		mockRecentItems
	} from '$lib/mocks';

	let { open = $bindable(false) }: { open: boolean } = $props();

	// Collect all file names from root + subfolders (max 10)
	const allFiles: { name: string; path: string }[] = (() => {
		const files: { name: string; path: string }[] = [];
		for (const file of mockAcmeFiles) {
			files.push({ name: file.name, path: file.path });
		}
		for (const folder of Object.keys(mockFolderContents)) {
			for (const file of mockFolderContents[folder]) {
				files.push({ name: file.name, path: file.path });
			}
		}
		return files.slice(0, 10);
	})();
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

		<Command.Group heading="Namespaces">
			{#each mockNamespaces.slice(0, 10) as ns}
				<Command.Item
					onSelect={() => {
						open = false;
					}}
					keywords={[ns.name, ns.org]}
				>
					<Folder class="mr-2 h-4 w-4 text-muted-foreground" />
					<span>{ns.org}/{ns.name}</span>
				</Command.Item>
			{/each}
		</Command.Group>

		<Command.Group heading="Files">
			{#each allFiles as file}
				<Command.Item
					onSelect={() => {
						open = false;
					}}
					keywords={[file.name, file.path]}
				>
					<FileText class="mr-2 h-4 w-4 text-muted-foreground" />
					<span>{file.path}</span>
				</Command.Item>
			{/each}
		</Command.Group>

		<Command.Group heading="Branches">
			{#each mockBranches.slice(0, 10) as branch}
				<Command.Item
					onSelect={() => {
						open = false;
					}}
					keywords={[branch.name]}
				>
					<GitBranch class="mr-2 h-4 w-4 text-muted-foreground" />
					<span>{branch.name}</span>
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
