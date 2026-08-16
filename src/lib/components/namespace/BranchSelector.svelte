<script lang="ts">
	import { GitBranch, ChevronDown, Check } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import type { Branch } from '$lib/types';

	interface Props {
		branches: Branch[];
		current: string;
		onSelect?: (branchName: string) => void;
	}

	let { branches, current = $bindable(), onSelect }: Props = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button variant="outline" size="sm" class="h-8 gap-1.5 border-border/50 px-3 text-sm">
			<GitBranch class="h-3.5 w-3.5" />
			<span class="font-medium">{current}</span>
			<ChevronDown class="h-3.5 w-3.5 text-muted-foreground" />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="start" class="w-64">
		<DropdownMenu.Label>Switch branches</DropdownMenu.Label>
		<DropdownMenu.Separator />
		{#each branches as branch}
			<DropdownMenu.Item
				onSelect={() => {
					current = branch.name;
					onSelect?.(branch.name);
				}}
			>
				<div class="flex w-full items-center justify-between">
					<span class="text-sm">{branch.name}</span>
					<div class="flex items-center gap-2">
						{#if branch.isDefault}
							<span class="text-xs text-muted-foreground">default</span>
						{/if}
						{#if branch.name === current}
							<Check class="h-3.5 w-3.5 text-serving-green" />
						{/if}
					</div>
				</div>
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
