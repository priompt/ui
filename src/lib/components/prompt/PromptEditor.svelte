<script lang="ts">
  import { detectSlots } from '$lib/utils/slots';
  import { Tag } from '@lucide/svelte';

  let { initialContent, fileName, content = $bindable(initialContent) }: {
    initialContent: string;
    fileName: string;
    content?: string;
  } = $props();

  let detectedSlots = $derived(detectSlots(content));
  let lines = $derived(content.split('\n'));
  let lineCount = $derived(lines.length);
  
  let textareaEl: HTMLTextAreaElement | undefined = $state();
  let scrollTop = $state(0);

  function handleScroll() {
    if (textareaEl) {
      scrollTop = textareaEl.scrollTop;
    }
  }
</script>

<div class="flex gap-4">
  <!-- Editor area -->
  <div class="flex-1 overflow-hidden rounded-lg border border-border bg-card">
    <div class="flex items-center justify-between border-b border-border px-4 py-2">
      <span class="text-sm font-medium text-foreground">{fileName}</span>
      <span class="text-xs text-muted-foreground">{lineCount} lines</span>
    </div>
    <div class="relative flex">
      <!-- Line numbers gutter - scrolls in sync with textarea -->
      <div 
        class="select-none border-r border-border bg-muted/20 px-3 font-mono text-xs text-muted-foreground shrink-0 overflow-hidden"
        style="padding-top: 12px; padding-bottom: 12px;"
      >
        <div style="transform: translateY(-{scrollTop}px);">
          {#each Array(lineCount) as _, i}
            <div class="text-right" style="height: 24px; line-height: 24px;">{i + 1}</div>
          {/each}
        </div>
      </div>
      <!-- Textarea -->
      <textarea
        bind:this={textareaEl}
        bind:value={content}
        onscroll={handleScroll}
        class="flex-1 resize-none bg-transparent font-mono text-sm text-foreground outline-none"
        style="padding: 12px 16px; line-height: 24px; height: {Math.max(lineCount + 1, 20) * 24 + 24}px; overflow-y: auto; max-height: 70vh;"
        spellcheck="false"
      ></textarea>
    </div>
  </div>

  <!-- Slots side panel -->
  <aside class="w-56 shrink-0">
    <div class="rounded-lg border border-border bg-card p-4 space-y-3">
      <h3 class="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
        <Tag class="h-3.5 w-3.5" />
        Detected Slots
        {#if detectedSlots.length > 0}
          <span class="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">{detectedSlots.length}</span>
        {/if}
      </h3>
      {#if detectedSlots.length > 0}
        <ul class="space-y-1">
          {#each detectedSlots as slot}
            <li>
              <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{`{{${slot}}}`}</code>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-sm text-muted-foreground">No slots detected</p>
      {/if}
    </div>
  </aside>
</div>
