<script lang="ts">
	import { buildBreadcrumbSegments } from '$lib/utils/path';

	let {
		namespace,
		branch,
		pathSegments
	}: { namespace: string; branch: string; pathSegments: string[] } = $props();

	let segments = $derived(buildBreadcrumbSegments(namespace, branch, pathSegments));
</script>

{#if pathSegments.length > 0}
	<nav aria-label="Breadcrumb" class="mb-4">
		<ol class="flex items-center gap-1.5 text-sm">
			{#each segments as segment, i}
				<li class="flex items-center gap-1.5">
					{#if i > 0}
						<span class="text-muted-foreground">/</span>
					{/if}
					{#if segment.isOverflow}
						<span class="text-muted-foreground">…</span>
					{:else if segment.href}
						<a
							href={segment.href}
							class="text-muted-foreground hover:text-foreground transition-colors"
						>
							{segment.label}
						</a>
					{:else}
						<span class="text-foreground font-medium">{segment.label}</span>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}
