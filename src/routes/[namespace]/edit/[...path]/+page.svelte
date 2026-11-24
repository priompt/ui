<script lang="ts">
  import PromptEditor from '$lib/components/prompt/PromptEditor.svelte';
  import CommitForm from '$lib/components/prompt/CommitForm.svelte';
  import SemanticVerdict from '$lib/components/history/SemanticVerdict.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Save, Sparkles } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { applyAction, deserialize } from '$app/forms';
  import { mockPromptContents, mockCommits } from '$lib/mocks/data';
  import { validateTemplate } from '$lib/utils/slots';
  import { commitMessage } from '$lib/utils/commit';

  let { data } = $props();

  // SvelteKit reuses this component when a client-side navigation lands on
  // another prompt's editor, so state seeded from `data` once would still belong
  // to the previous prompt and Save would publish its text onto this one. The
  // draft is derived from the prompt being edited: it is re-seeded when that
  // changes and stays assignable, so typing works as usual. It is keyed on the
  // prompt and branch rather than on `data`, so a background reload of the same
  // prompt does not discard what the author is typing.
  const draftKey = $derived(`${data.branch}:${data.filePath}`);
  let content = $derived.by(() => {
    void draftKey;
    return untrack(() => data.content);
  });
  let showCommitDialog = $state(false);
  let saving = $state(false);
  let saveError = $state<string | null>(null);
  let conflictHref = $state<string | null>(null);
  let retryable = $state(false);
  let preview = $state<{ changes: unknown[]; verdict: string } | null>(null);
  let previewing = $state(false);

  // Messages, the verdict and the open dialog belong to one prompt as well.
  $effect.pre(() => {
    void draftKey;
    untrack(() => {
      showCommitDialog = false;
      saveError = null;
      conflictHref = null;
      retryable = false;
      preview = null;
    });
  });

  // The same rules the server enforces on write and on serve. Without this the
  // editor happily saved an empty prompt onto the branch marked "serving" — a
  // publish would have refused it outright.
  const validationError = $derived(validateTemplate(content));

  async function post(action: string, fields: Record<string, string>) {
    const body = new FormData();
    for (const [k, v] of Object.entries(fields)) body.append(k, v);
    const res = await fetch(`?/${action}`, { method: 'POST', body });
    return deserialize(await res.text());
  }

  /** Ask the server what this edit *means* before committing it. */
  async function handlePreview() {
    previewing = true;
    saveError = null;
    conflictHref = null;
    try {
      const result = await post('preview', { content });
      if (result.type === 'success') {
        preview = result.data as { changes: unknown[]; verdict: string };
      } else if (result.type === 'failure') {
        saveError = (result.data?.error as string) ?? 'Could not analyse this edit.';
      }
    } finally {
      previewing = false;
    }
  }

  async function handleCommit(commitData: { message: string; description: string; branch: string }) {
    saveError = null;
    conflictHref = null;
    retryable = false;
    const message = commitMessage(commitData.message, commitData.description);

    if (!data.live) {
      // No server configured: keep the fixture behaviour so the prototype still
      // demonstrates the flow.
      if (mockPromptContents[data.filePath]) mockPromptContents[data.filePath].content = content;
      mockCommits.unshift({
        hash: Math.random().toString(36).slice(2, 9),
        message,
        author: 'You',
        date: new Date().toISOString(),
        files: [data.filePath],
        diff: undefined,
        semanticVerdict: undefined
      });
      goto(`/${data.namespace}/blob/${commitData.branch}/${data.filePath}`);
      return;
    }

    saving = true;
    try {
      const result = await post('save', {
        content,
        message,
        branch: commitData.branch,
        // The tip of that branch when this editor loaded, so the server side can
        // refuse a save made on top of a version that has since changed.
        base: data.bases[commitData.branch] ?? ''
      });
      if (result.type === 'success') {
        showCommitDialog = false;
        goto(`/${data.namespace}/blob/${commitData.branch}/${data.filePath}`);
        return;
      }
      if (result.type === 'failure') {
        saveError = (result.data?.error as string) ?? 'Publish failed.';
        // ABORTED means two publishes raced inside the server; UNAVAILABLE means
        // the write landed but the cache did not clear. Both are worth retrying,
        // and the author should be told which they are looking at.
        retryable = Boolean(result.data?.retryable);
        // A save made on a version that has since changed is refused, not
        // retried: the draft stays in the editor and this links to what replaced
        // the version it started from.
        conflictHref = result.data?.conflict ? ((result.data.currentHref as string) ?? null) : null;
        showCommitDialog = false;
        return;
      }
      await applyAction(result);
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Editing {data.fileName} — {data.namespace} — Priompt</title>
</svelte:head>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h1 class="text-lg font-semibold text-foreground">
      Editing <span class="font-mono text-muted-foreground">{data.filePath}</span>
    </h1>
    <div class="flex items-center gap-2">
      {#if data.live}
        <Button
          variant="outline"
          disabled={validationError !== null || previewing}
          onclick={handlePreview}
        >
          <Sparkles class="mr-1.5 h-4 w-4" />
          {previewing ? 'Analysing…' : 'Check impact'}
        </Button>
      {/if}
      <Button disabled={validationError !== null || saving} onclick={() => (showCommitDialog = true)}>
        <Save class="mr-1.5 h-4 w-4" />
        {saving ? 'Publishing…' : 'Save'}
      </Button>
    </div>
  </div>

  {#if validationError}
    <p role="alert" class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {validationError}
    </p>
  {/if}

  {#if saveError}
    <p role="alert" class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {saveError}
      {#if conflictHref}
        <a href={conflictHref} target="_blank" rel="noreferrer" class="mt-1 block text-xs underline">
          Open the current version in a new tab (your draft stays here)
        </a>
      {/if}
      {#if retryable}
        <span class="block text-xs opacity-80">
          This one is safe to retry — nothing was lost.
        </span>
      {/if}
    </p>
  {/if}

  <PromptEditor initialContent={data.content} fileName={data.fileName} bind:content />

  <!-- The verdict before the commit, not after it in the history. -->
  {#if preview}
    <SemanticVerdict changes={preview.changes as never} verdict={preview.verdict} />
  {/if}
</div>

<CommitForm
  bind:open={showCommitDialog}
  branches={data.branches}
  currentBranch={data.branch}
  onCommit={handleCommit}
/>
