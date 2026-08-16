<script lang="ts">
  import { goto } from '$app/navigation';
  import DiffViewer from '$lib/components/history/DiffViewer.svelte';
  import { GitCompare, FileText } from '@lucide/svelte';
  import type { Branch, ComparisonSummary } from '$lib/types';

  let { base, head, branches, namespace, comparison }: {
    base: string;
    head: string;
    branches: Branch[];
    namespace: string;
    comparison: ComparisonSummary;
  } = $props();

  let selectedBase = $state(base);
  let selectedHead = $state(head);

  function handleBaseChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedBase = target.value;
    goto(`/${namespace}/compare/${selectedBase}...${selectedHead}`);
  }

  function handleHeadChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedHead = target.value;
    goto(`/${namespace}/compare/${selectedBase}...${selectedHead}`);
  }
</script>

<div class="space-y-6">
  <!-- Branch selectors -->
  <div class="flex items-center gap-3 flex-wrap">
    <div class="flex items-center gap-2">
      <label for="base-select" class="text-sm text-muted-foreground">base:</label>
      <select
        id="base-select"
        value={selectedBase}
        onchange={handleBaseChange}
        class="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {#each branches as branch}
          <option value={branch.name}>{branch.name}</option>
        {/each}
      </select>
    </div>
    <GitCompare class="h-4 w-4 text-muted-foreground" />
    <div class="flex items-center gap-2">
      <label for="head-select" class="text-sm text-muted-foreground">compare:</label>
      <select
        id="head-select"
        value={selectedHead}
        onchange={handleHeadChange}
        class="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {#each branches as branch}
          <option value={branch.name}>{branch.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Summary -->
  {#if selectedBase === selectedHead}
    <div class="rounded-lg border border-border bg-card p-6 text-center">
      <p class="text-sm text-muted-foreground">No differences — same branch selected for both base and compare.</p>
    </div>
  {:else}
    <div class="flex items-center gap-6 rounded-lg border border-border bg-card p-4">
      <div class="text-sm">
        <span class="font-medium text-foreground">{comparison.commitsAhead}</span>
        <span class="text-muted-foreground"> commits ahead</span>
      </div>
      <div class="text-sm">
        <span class="font-medium text-foreground">{comparison.commitsBehind}</span>
        <span class="text-muted-foreground"> commits behind</span>
      </div>
      <div class="text-sm">
        <span class="font-medium text-foreground">{comparison.filesChanged}</span>
        <span class="text-muted-foreground"> files changed</span>
      </div>
    </div>

    <!-- File diffs -->
    {#each comparison.fileDiffs as fileDiff}
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-sm">
          <FileText class="h-4 w-4 text-muted-foreground" />
          <span class="font-mono text-foreground">{fileDiff.path}</span>
        </div>
        <DiffViewer diff={fileDiff.diff} />
      </div>
    {/each}
  {/if}
</div>
