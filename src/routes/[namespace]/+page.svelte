<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import BranchSelector from '$lib/components/namespace/BranchSelector.svelte';
	import ServingBadge from '$lib/components/namespace/ServingBadge.svelte';
	import ActionBar from '$lib/components/namespace/ActionBar.svelte';
	import FileTable from '$lib/components/namespace/FileTable.svelte';
	let { data } = $props();

	const namespace = $derived(page.params.namespace);
	const currentBranch = $derived(data.branches.find((b) => b.isDefault) ?? data.branches[0]);
	const latestCommit = $derived(data.latestCommit);

	function handleBranchSelect(branchName: string) {
		goto(`/${namespace}/tree/${branchName}`);
	}
</script>

<svelte:head>
	<title>{namespace} — Priompt</title>
</svelte:head>

<!-- Branch selector + serving badge + actions -->
<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
	<div class="flex items-center gap-3">
		<BranchSelector branches={data.branches} current={currentBranch?.name ?? "main"} onSelect={handleBranchSelect} />
		<ServingBadge serving={currentBranch.isServing} />
	</div>
	<ActionBar namespace={namespace} />
</div>

<!-- File table with integrated commit header -->
<FileTable files={data.files} namespace={namespace} branch={currentBranch?.name ?? "main"} latestCommit={latestCommit} />
