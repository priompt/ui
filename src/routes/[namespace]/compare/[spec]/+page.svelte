<script lang="ts">
	import CompareView from '$lib/components/branch/CompareView.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Comparing {data.base}...{data.head} — {data.namespace} — Priompt</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="text-lg font-semibold text-foreground">Compare changes</h1>
	<CompareView
		base={data.base}
		head={data.head}
		branches={data.branches}
		namespace={data.namespace}
		comparison={data.comparison}
	/>
</div>
