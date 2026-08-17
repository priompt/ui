<script lang="ts">
  import PromptEditor from '$lib/components/prompt/PromptEditor.svelte';
  import CommitForm from '$lib/components/prompt/CommitForm.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Save } from '@lucide/svelte';

  let { data, form } = $props();
  let content = $state(data.content);
  let showCommitDialog = $state(false);
  let commitMessage = $state('');
  let commitBranch = $state(data.branch);
  let publishForm: HTMLFormElement;

  // ponytail: hidden native form submit. Swap for use:enhance when the dialog
  // needs to stay open and show server-side validation inline.
  function handleCommit(commitData: { message: string; description: string; branch: string }) {
    commitMessage = commitData.message;
    commitBranch = commitData.branch;
    publishForm.requestSubmit();
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
    <Button onclick={() => showCommitDialog = true}>
      <Save class="mr-1.5 h-4 w-4" />
      Save
    </Button>
  </div>

  {#if form?.message}
    <p class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground">
      Server rejected the publish: {form.message}
    </p>
  {/if}

  <PromptEditor
    initialContent={data.content}
    fileName={data.fileName}
    bind:content
  />
</div>

<form method="POST" action="?/publish" bind:this={publishForm} class="hidden">
  <input type="hidden" name="content" value={content} />
  <input type="hidden" name="message" value={commitMessage} />
  <input type="hidden" name="branch" value={commitBranch} />
</form>

<!-- Commit dialog -->
<CommitForm
  bind:open={showCommitDialog}
  branches={data.branches}
  currentBranch={data.branch}
  onCommit={handleCommit}
/>
