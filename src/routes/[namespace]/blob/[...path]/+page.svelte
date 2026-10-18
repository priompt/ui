<script lang="ts">
  import LiveUpdates from '$lib/components/prompt/LiveUpdates.svelte';
  import PromptViewer from '$lib/components/prompt/PromptViewer.svelte';
  import PromptMeta from '$lib/components/prompt/PromptMeta.svelte';
  import PromptActions from '$lib/components/prompt/PromptActions.svelte';
  import { goto } from '$app/navigation';
  import { GitBranch } from '@lucide/svelte';

  let { data } = $props();
</script>

{#if data.live}
  <div class="mb-2 flex justify-end">
    <LiveUpdates namespace={data.namespace} path={data.filePath} />
  </div>
{/if}


<svelte:head>
  <title>{data.fileName} — {data.namespace} — Priompt</title>
</svelte:head>

<div class="space-y-4">
  <!-- Header with file info and actions -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <h1 class="text-lg font-semibold text-foreground">{data.fileName}</h1>
      <!-- Switching branch here is how Edit and History reach a branch other than main. -->
      <label class="flex items-center gap-1.5 text-sm text-muted-foreground">
        <GitBranch class="h-3.5 w-3.5" />
        <span class="sr-only">Branch</span>
        <select
          aria-label="Branch"
          class="rounded-md border border-border bg-background py-1 pl-2 pr-8 font-mono text-sm text-foreground"
          value={data.branch}
          onchange={(e) => goto(`/${data.namespace}/blob/${(e.currentTarget as HTMLSelectElement).value}/${data.filePath}`)}
        >
          {#each data.branches as b}
            <option value={b.name}>{b.name}</option>
          {/each}
        </select>
      </label>
      <span class="text-xs text-muted-foreground">{data.fileSize} bytes</span>
      {#if data.slots.length > 0}
        <span class="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
          {data.slots.length} slots
        </span>
      {/if}
    </div>
    <PromptActions
      namespace={data.namespace}
      branch={data.branch}
      filePath={data.filePath}
      content={data.content}
    />
  </div>

  <!-- Main content + sidebar -->
  <div class="flex flex-col gap-6 md:flex-row">
    <div class="min-w-0 flex-1">
      <PromptViewer
        content={data.content}
        fileName={data.fileName}
        slots={data.slots}
      />
    </div>
    <PromptMeta
      branch={data.branch}
      lastCommit={data.lastCommit}
      slots={data.slots}
      fileSize={data.fileSize}
    />
  </div>
</div>
