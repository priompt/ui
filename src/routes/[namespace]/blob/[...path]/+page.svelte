<script lang="ts">
  import LiveUpdates from '$lib/components/prompt/LiveUpdates.svelte';
  import PromptViewer from '$lib/components/prompt/PromptViewer.svelte';
  import PromptMeta from '$lib/components/prompt/PromptMeta.svelte';
  import PromptActions from '$lib/components/prompt/PromptActions.svelte';

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
