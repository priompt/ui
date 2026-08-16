<script lang="ts">
  import { GitBranch, Tag } from '@lucide/svelte';
  import type { CommitSummary } from '$lib/types';

  let { branch, lastCommit, slots, fileSize }: {
    branch: string;
    lastCommit: CommitSummary;
    slots: string[];
    fileSize: number;
  } = $props();

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
</script>

<aside class="w-72 space-y-4 shrink-0">
  <!-- File info -->
  <div class="rounded-lg border border-border bg-card p-4 space-y-3">
    <h3 class="text-xs font-semibold uppercase text-muted-foreground">File Info</h3>
    <div class="space-y-2 text-sm">
      <div class="flex items-center gap-2">
        <GitBranch class="h-4 w-4 text-muted-foreground" />
        <span class="text-foreground">{branch}</span>
      </div>
      <div class="flex items-center gap-2 text-muted-foreground">
        <span class="font-mono text-xs">{lastCommit.hash.slice(0, 7)}</span>
        <span>·</span>
        <span>{lastCommit.author}</span>
      </div>
      <p class="text-xs text-muted-foreground">{formatBytes(fileSize)}</p>
    </div>
  </div>

  <!-- Detected Slots -->
  <div class="rounded-lg border border-border bg-card p-4 space-y-3">
    <h3 class="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
      <Tag class="h-3.5 w-3.5" />
      Detected Slots
      {#if slots.length > 0}
        <span class="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">{slots.length}</span>
      {/if}
    </h3>
    {#if slots.length > 0}
      <ul class="space-y-1">
        {#each slots as slot}
          <li class="flex items-center gap-2 text-sm">
            <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{`{{${slot}}}`}</code>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-sm text-muted-foreground">No slots detected</p>
    {/if}
  </div>
</aside>
