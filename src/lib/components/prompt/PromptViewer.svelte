<script lang="ts">
  let { content, fileName, slots }: { content: string; fileName: string; slots: string[] } = $props();

  // Split content into lines for numbered display
  let lines = $derived(content.split('\n'));

  // Regex to find slot patterns for highlighting
  const SLOT_PATTERN = /(\{[a-zA-Z_][a-zA-Z0-9_]*\})/g;
</script>

<div class="overflow-hidden rounded-lg border border-border bg-card">
  <div class="flex items-center justify-between border-b border-border px-4 py-2">
    <span class="text-sm font-medium text-foreground">{fileName}</span>
    <span class="text-xs text-muted-foreground">{lines.length} lines</span>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full">
      <tbody>
        {#each lines as line, i}
          <tr class="hover:bg-muted/30">
            <td class="select-none border-r border-border px-3 py-0.5 text-right align-top font-mono text-xs text-muted-foreground">
              {i + 1}
            </td>
            <td class="whitespace-pre-wrap px-4 py-0.5 font-mono text-sm text-foreground">
              {#each line.split(SLOT_PATTERN) as part}
                {#if part.match(SLOT_PATTERN)}
                  <span class="rounded bg-blue-500/20 px-1 text-blue-300">{part}</span>
                {:else}
                  {part}
                {/if}
              {/each}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
