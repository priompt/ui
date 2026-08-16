<script lang="ts">
  import { parseDiff } from '$lib/utils/diff';

  let { diff }: { diff: string | undefined } = $props();

  let lines = $derived(diff ? parseDiff(diff) : []);
</script>

{#if !diff}
  <div class="rounded-md border border-border/60 bg-muted/20 px-4 py-8 text-center">
    <p class="text-xs text-muted-foreground">No changes to display</p>
  </div>
{:else}
  <div class="overflow-x-auto rounded-md border border-border">
    <table class="w-full border-collapse font-mono text-xs">
      <tbody>
        {#each lines as line}
          {#if line.type === 'header'}
            <tr>
              <td colspan="3" class="bg-blue-500/5 border-b border-border px-4 py-1 text-blue-400/80 select-none">
                {line.content}
              </td>
            </tr>
          {:else if line.type === 'added'}
            <tr class="bg-green-500/8">
              <td class="w-10 select-none border-r border-border/40 px-2 py-px text-right text-muted-foreground/50"></td>
              <td class="w-10 select-none border-r border-border/40 px-2 py-px text-right text-green-400/70">{line.newLineNum}</td>
              <td class="px-3 py-px text-green-300 whitespace-pre">+{line.content}</td>
            </tr>
          {:else if line.type === 'removed'}
            <tr class="bg-red-500/8">
              <td class="w-10 select-none border-r border-border/40 px-2 py-px text-right text-red-400/70">{line.oldLineNum}</td>
              <td class="w-10 select-none border-r border-border/40 px-2 py-px text-right text-muted-foreground/50"></td>
              <td class="px-3 py-px text-red-300 whitespace-pre">-{line.content}</td>
            </tr>
          {:else}
            <tr>
              <td class="w-10 select-none border-r border-border/40 px-2 py-px text-right text-muted-foreground/40">{line.oldLineNum}</td>
              <td class="w-10 select-none border-r border-border/40 px-2 py-px text-right text-muted-foreground/40">{line.newLineNum}</td>
              <td class="px-3 py-px text-foreground/70 whitespace-pre">{line.content}</td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
{/if}
