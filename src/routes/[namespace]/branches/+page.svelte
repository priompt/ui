<script lang="ts">
	import { GitBranch, Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import CreateBranchDialog from '$lib/components/branch/CreateBranchDialog.svelte';
	import { mockBranches } from '$lib/mocks';
	import { page } from '$app/state';
	import type { Branch } from '$lib/types';

	let branches = $state<Branch[]>([...mockBranches]);
	let showCreateDialog = $state(false);

	const namespace = $derived(page.params.namespace);

	function handleCreateBranch(name: string, sourceBranch: string) {
		const source = branches.find((b) => b.name === sourceBranch);
		const newBranch: Branch = {
			name,
			isDefault: false,
			isServing: false,
			lastCommit: source?.lastCommit ?? branches[0].lastCommit
		};
		branches = [...branches, newBranch];
		mockBranches.push(newBranch);
	}

	function getRelativeTime(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		if (diffMins < 60) return `${diffMins} minutes ago`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours} hours ago`;
		const diffDays = Math.floor(diffHours / 24);
		return `${diffDays} days ago`;
	}

	function truncateMessage(msg: string, max: number = 72): string {
		return msg.length > max ? msg.slice(0, max) + '\u2026' : msg;
	}
</script>

<svelte:head>
	<title>Branches — {namespace} — Priompt</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-lg font-semibold text-foreground">Branches</h1>
		<Button variant="default" size="sm" onclick={() => (showCreateDialog = true)}>
			<Plus class="mr-1.5 h-3.5 w-3.5" />
			New branch
		</Button>
	</div>

	{#if branches.length === 0}
		<div class="rounded-lg border border-border bg-card p-8 text-center">
			<GitBranch class="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">No branches exist</p>
		</div>
	{:else}
		<div class="space-y-1">
			{#each branches as branch}
				<div
					class="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30"
				>
					<GitBranch class="h-5 w-5 shrink-0 text-muted-foreground" />
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium text-foreground">{branch.name}</span>
							{#if branch.isDefault}
								<span
									class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
									>default</span
								>
							{/if}
							{#if branch.isServing}
								<span class="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400"
									>serving</span
								>
							{/if}
						</div>
						<p class="mt-1 truncate text-sm text-muted-foreground">
							{truncateMessage(branch.lastCommit.message)} · {branch.lastCommit.author} · {getRelativeTime(branch.lastCommit.date)}
						</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<CreateBranchDialog
	bind:open={showCreateDialog}
	branches={branches}
	onClose={() => (showCreateDialog = false)}
	onCreate={handleCreateBranch}
/>
