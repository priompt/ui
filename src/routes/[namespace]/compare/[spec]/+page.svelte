<script lang="ts">
	import CompareView from '$lib/components/branch/CompareView.svelte';
	import SemanticVerdict from '$lib/components/history/SemanticVerdict.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Comparing {data.base}...{data.head} — {data.namespace} — Priompt</title>
</svelte:head>

<div class="space-y-4">
	<h1 class="text-lg font-semibold text-foreground">Compare changes</h1>

	{#if data.error}
		<p role="alert" class="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
			{data.error}
		</p>
	{:else if data.identical}
		<p class="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
			<code class="font-mono">{data.base}</code> and <code class="font-mono">{data.head}</code> point at the same commit — nothing to compare.
		</p>
	{/if}
	<CompareView
		base={data.base}
		head={data.head}
		branches={data.branches}
		namespace={data.namespace}
		comparison={data.comparison}
	/>

	<!-- Not just what differs between the branches, but what the difference means. -->
	{#if data.live}
		<SemanticVerdict changes={data.changes} verdict={data.verdict} />
	{/if}
</div>
