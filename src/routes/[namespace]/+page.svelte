<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import BranchSelector from '$lib/components/namespace/BranchSelector.svelte';
	import ServingBadge from '$lib/components/namespace/ServingBadge.svelte';
	import ActionBar from '$lib/components/namespace/ActionBar.svelte';
	import FileTable from '$lib/components/namespace/FileTable.svelte';
	import { mockAcmeFiles, mockBranches } from '$lib/mocks';

	const namespace = $derived(page.params.namespace);
	const currentBranch = $derived(mockBranches.find((b) => b.isDefault)!);
	const latestCommit = $derived(mockAcmeFiles[1].lastCommit);

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
		<BranchSelector branches={mockBranches} current={currentBranch.name} onSelect={handleBranchSelect} />
		<ServingBadge serving={currentBranch.isServing} />
	</div>
	<ActionBar namespace={namespace} />
</div>

<!-- File table with integrated commit header -->
<FileTable files={mockAcmeFiles} namespace={namespace} branch={currentBranch.name} latestCommit={latestCommit} />
