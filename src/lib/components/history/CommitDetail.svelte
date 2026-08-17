<script lang="ts">
  import type { Commit } from '$lib/types';
  import DiffViewer from './DiffViewer.svelte';
  import { FileText, Sparkles, Copy, Check } from '@lucide/svelte';

  let { commit, namespace }: { commit: Commit; namespace: string } = $props();

  let copiedHash = $state(false);

  function copyHash() {
    navigator.clipboard.writeText(commit.hash);
    copiedHash = true;
    setTimeout(() => { copiedHash = false; }, 2000);
  }
</script>

<!-- Commit header — full width, no card wrapping -->
<div class="border-b border-border pb-5 mb-6">
  <h1 class="text-xl font-semibold text-foreground leading-snug">{commit.message}</h1>
  <div class="mt-3 flex items-center gap-3 text-sm">
    <!-- Author pill -->
    <div class="flex items-center gap-1.5">
      <div class="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
        <span class="text-[10px] font-medium text-muted-foreground">{commit.author[0]}</span>
      </div>
      <span class="font-medium text-foreground">{commit.author}</span>
    </div>
    <span class="text-muted-foreground">committed on {new Date(commit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    <!-- Hash with copy -->
    <button onclick={copyHash} class="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-link-blue transition-colors ml-auto">
      {#if copiedHash}
        <Check class="h-3 w-3 text-green-400" />
      {:else}
        <Copy class="h-3 w-3" />
      {/if}
      {commit.hash}
    </button>
  </div>
</div>

<!-- Semantic analysis (if present) — subtle, not a screaming blue box -->
{#if commit.semanticVerdict}
  <div class="mb-6 flex gap-3 rounded-md bg-muted/40 px-4 py-3">
    <Sparkles class="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
    <div>
      <span class="text-xs font-medium text-blue-400 uppercase tracking-wide">Semantic diff</span>
      <p class="mt-1 text-sm text-foreground/90 leading-relaxed">{commit.semanticVerdict}</p>
    </div>
  </div>
{/if}

<!-- Files changed — compact horizontal list -->
<div class="mb-4">
  <div class="flex items-center gap-2 mb-2">
    <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {commit.files.length} file{commit.files.length !== 1 ? 's' : ''} changed
    </span>
  </div>
  <div class="flex flex-wrap gap-1.5">
    {#each commit.files as file}
      <a href="/{namespace}/blob/main/{file}" class="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs font-mono text-foreground hover:border-link-blue hover:text-link-blue transition-colors">
        <FileText class="h-3 w-3 text-muted-foreground" />
        {file}
      </a>
    {/each}
  </div>
</div>

<!-- Diff -->
<DiffViewer diff={commit.diff} />
