<script lang="ts">
  import PromptEditor from '$lib/components/prompt/PromptEditor.svelte';
  import CommitForm from '$lib/components/prompt/CommitForm.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Save } from '@lucide/svelte';
  import { goto } from '$app/navigation';
  import { mockPromptContents, mockCommits } from '$lib/mocks/data';
  import { validateTemplate } from '$lib/utils/slots';

  let { data } = $props();
  let content = $state(data.content);
  let showCommitDialog = $state(false);

  // The same rules the server enforces on write and on serve. Without this the
  // editor happily saved an empty prompt onto the branch marked "serving" — a
  // publish would have refused it outright.
  const validationError = $derived(validateTemplate(content));

  function handleCommit(commitData: { message: string; description: string; branch: string }) {
    // Update mock data in memory
    if (mockPromptContents[data.filePath]) {
      mockPromptContents[data.filePath].content = content;
    }

    // Add new commit
    mockCommits.unshift({
      hash: Math.random().toString(36).slice(2, 9),
      message: commitData.message,
      author: 'You',
      authorAvatar: undefined,
      date: new Date().toISOString(),
      files: [data.filePath],
      diff: undefined,
      semanticVerdict: undefined
    });

    // Navigate to blob view
    goto(`/${data.namespace}/blob/${commitData.branch}/${data.filePath}`);
  }
</script>

<svelte:head>
  <title>Editing {data.fileName} — {data.namespace} — Priompt</title>
</svelte:head>

<div class="space-y-4">
  <!-- Header with title and Save button -->
  <div class="flex items-center justify-between">
    <h1 class="text-lg font-semibold text-foreground">
      Editing <span class="font-mono text-muted-foreground">{data.filePath}</span>
    </h1>
    <Button disabled={validationError !== null} onclick={() => showCommitDialog = true}>
      <Save class="mr-1.5 h-4 w-4" />
      Save
    </Button>
  </div>

  {#if validationError}
    <p role="alert" class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {validationError}
    </p>
  {/if}

  <PromptEditor
    initialContent={data.content}
    fileName={data.fileName}
    bind:content
  />
</div>

<!-- Commit dialog -->
<CommitForm
  bind:open={showCommitDialog}
  branches={data.branches}
  currentBranch={data.branch}
  onCommit={handleCommit}
/>
