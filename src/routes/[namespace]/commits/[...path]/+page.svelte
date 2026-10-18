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

  {#if data.live && !data.filePath}
    <!-- History is per prompt: each prompt has its own chain, so pick one. -->
    <p class="mb-3 text-sm text-muted-foreground">History is per prompt. Pick a prompt to see its commits.</p>
    <ul class="divide-y divide-border/60 rounded-lg border border-border bg-card">
      {#each data.prompts ?? [] as p}
        <li>
          <a class="block px-4 py-2 font-mono text-sm text-foreground hover:text-link-blue" href="/{data.namespace}/commits/{data.branch}/{p}">{p}</a>
        </li>
      {:else}
        <li class="px-4 py-3 text-sm text-muted-foreground">No prompts in this namespace.</li>
      {/each}
    </ul>
  {:else}
    <CommitTimeline commits={data.commits} namespace={data.namespace} path={data.filePath} />
  {/if}
</div>
