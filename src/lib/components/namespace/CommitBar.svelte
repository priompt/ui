<script lang="ts">
	import { History } from '@lucide/svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import type { CommitSummary } from '$lib/types';

	interface Props {
		commit: CommitSummary;
	}

	let { commit }: Props = $props();
</script>

<div class="mt-4 flex items-center justify-between rounded-lg border border-table-border bg-card/30 px-4 py-3">
	<div class="flex items-center gap-3">
		<Avatar.Root class="h-6 w-6">
			{#if commit.authorAvatar}
				<Avatar.Image src={commit.authorAvatar} alt={commit.author} />
			{/if}
			<Avatar.Fallback class="text-xs">{commit.author[0]}</Avatar.Fallback>
		</Avatar.Root>
		<div class="flex items-center gap-2 text-sm">
			<span class="font-medium text-foreground">{commit.author}</span>
			<span class="text-muted-foreground">·</span>
			<span class="text-muted-foreground">{commit.message}</span>
		</div>
	</div>

	<div class="flex items-center gap-3">
		<div class="text-right">
			<p class="text-xs text-muted-foreground">Latest commit</p>
			<p class="font-mono text-xs text-link-blue">{commit.hash}</p>
		</div>
		<Button variant="outline" size="sm" class="h-8 gap-1.5">
			<History class="h-3.5 w-3.5" />
			View history
		</Button>
	</div>
</div>
