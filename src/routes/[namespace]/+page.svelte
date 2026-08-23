<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import BranchSelector from '$lib/components/namespace/BranchSelector.svelte';
	import ServingBadge from '$lib/components/namespace/ServingBadge.svelte';
	import ActionBar from '$lib/components/namespace/ActionBar.svelte';
	import FileTable from '$lib/components/namespace/FileTable.svelte';
	let { data } = $props();

	const namespace = $derived(page.params.namespace);
	// The server being unreachable is a normal state, not an exception: the loader
	// returns an empty branch list and an error, and this page has to render it
	// rather than throw. It used to dereference currentBranch unguarded, which
	// turned a degraded backend into a 500 page with nothing on it.
	const FALLBACK_BRANCH = {
		name: 'main',
		isDefault: true,
		isServing: true,
		lastCommit: { hash: '', message: '', author: '', date: '' }
	};
	const currentBranch = $derived(
		data.branches.find((b) => b.isDefault) ?? data.branches[0] ?? FALLBACK_BRANCH
	);
	const latestCommit = $derived(data.latestCommit);

	function handleBranchSelect(branchName: string) {
		goto(`/${namespace}/tree/${branchName}`);
	}
</script>

<svelte:head>
	<title>{namespace} — Priompt</title>
</svelte:head>

{#if data.error}
	<p role="alert" class="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
		Could not reach the Priompt server — {data.error}
	</p>
{/if}

<!-- Branch selector + serving badge + actions -->
<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
	<div class="flex items-center gap-3">
		<BranchSelector branches={data.branches} current={currentBranch.name} onSelect={handleBranchSelect} />
		<ServingBadge serving={currentBranch.isServing} />
	</div>
	<ActionBar namespace={namespace} />
</div>

<!-- File table with integrated commit header -->
{#if data.files.length === 0 && !data.error}
	<p class="rounded-lg border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
		No prompts in this namespace yet.
	</p>
{:else}
	<FileTable files={data.files} namespace={namespace} branch={currentBranch.name} latestCommit={latestCommit} />
{/if}
