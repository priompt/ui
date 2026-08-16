<script lang="ts">
	import { page } from '$app/state';

	const path = $derived(page.params.path);
</script>

<svelte:head>
	<title>{path} — Priompt</title>
</svelte:head>

<div class="py-4">
	<p class="text-muted-foreground">Tree view for: <code class="text-foreground">{path}</code></p>
	<!-- TODO: Implement subfolder tree view in Phase 3 -->
</div>
