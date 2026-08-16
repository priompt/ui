<script lang="ts">
  import CommitTimeline from '$lib/components/history/CommitTimeline.svelte';
  import { GitCommit } from '@lucide/svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Commits{data.filePath ? ` · ${data.filePath}` : ''} — {data.namespace} — Priompt</title>
</svelte:head>

<div>
  <!-- Header -->
  <div class="flex items-center justify-between border-b border-border pb-4 mb-6">
    <div class="flex items-center gap-2.5">
      <GitCommit class="h-5 w-5 text-muted-foreground" />
      <h1 class="text-base font-semibold text-foreground">
        Commits
        {#if data.filePath}
          <span class="ml-1 font-mono text-sm font-normal text-muted-foreground">/{data.filePath}</span>
        {/if}
      </h1>
    </div>
    <span class="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{data.commits.length}</span>
  </div>

  <CommitTimeline commits={data.commits} namespace={data.namespace} />
</div>
