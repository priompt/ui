<script lang="ts">
  import { Pencil, History, FileText, Copy, Check } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';

  let { namespace, branch, filePath, content }: {
    namespace: string;
    branch: string;
    filePath: string;
    content: string;
  } = $props();

  let copied = $state(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }
</script>

<div class="flex items-center gap-2">
  <Button variant="outline" size="sm" href="/{namespace}/edit/{branch}/{filePath}">
    <Pencil class="mr-1.5 h-3.5 w-3.5" />
    Edit
  </Button>
  <Button variant="outline" size="sm" href="/{namespace}/commits/{branch}/{filePath}">
    <History class="mr-1.5 h-3.5 w-3.5" />
    History
  </Button>
  <Button variant="outline" size="sm" href="/{namespace}/blob/{branch}/{filePath}?raw=true">
    <FileText class="mr-1.5 h-3.5 w-3.5" />
    Raw
  </Button>
  <Button variant="outline" size="sm" onclick={handleCopy}>
    {#if copied}
      <Check class="mr-1.5 h-3.5 w-3.5 text-green-400" />
      Copied!
    {:else}
      <Copy class="mr-1.5 h-3.5 w-3.5" />
      Copy
    {/if}
  </Button>
</div>
