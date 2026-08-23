<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { detectSlots, validateTemplate } from '$lib/utils/slots';

  let { data, form } = $props();

  let fileName = $state(form?.fileName ?? '');
  let folder = $state(form?.folder ?? data.folder ?? '');
  let content = $state(form?.content ?? '');
  let message = $state(form?.message ?? '');

  const slots = $derived(detectSlots(content));
  const lineCount = $derived(content.split('\n').length);
  // The same rules the server enforces, so the form refuses what a publish would.
  const invalid = $derived(content ? validateTemplate(content) : null);

  const target = $derived(() => {
    const n = fileName.endsWith('.prompt') ? fileName : fileName ? `${fileName}.prompt` : '';
    if (!n) return '';
    const p = folder ? `${folder}/${n}` : n;
    return `priompt://${data.namespace}/${p.replace(/\.prompt$/, '')}`;
  });
</script>

<svelte:head><title>New prompt — {data.namespace} — Priompt</title></svelte:head>

<div class="space-y-4">
  <h1 class="text-lg font-semibold text-foreground">Create new prompt</h1>

  {#if form?.error}
    <p role="alert" class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {form.error}
      {#if form.retryable}<span class="block text-xs opacity-80">Safe to retry — nothing was lost.</span>{/if}
    </p>
  {/if}

  <form method="POST" class="grid gap-4 lg:grid-cols-[1fr_18rem]">
    <div class="space-y-4">
      <div class="flex flex-wrap gap-3">
        <div class="flex-1">
          <label for="fileName" class="mb-1 block text-sm font-medium text-foreground">File name</label>
          <input id="fileName" name="fileName" bind:value={fileName} placeholder="my-prompt.prompt"
            class="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground" />
        </div>
        <div class="w-56">
          <label for="folder" class="mb-1 block text-sm font-medium text-foreground">Folder</label>
          <input id="folder" name="folder" bind:value={folder} list="folders" placeholder="support"
            class="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground" />
          <datalist id="folders">
            {#each data.folders as f}<option value={f}></option>{/each}
          </datalist>
        </div>
      </div>

      {#if target()}
        <p class="font-mono text-xs text-muted-foreground">
          Address: <span class="text-foreground">{target()}</span>
        </p>
      {/if}

      <div class="rounded-lg border border-border bg-card">
        <div class="flex items-center justify-between border-b border-border px-4 py-2">
          <span class="font-mono text-sm text-foreground">Content</span>
          <span class="text-xs text-muted-foreground">{lineCount} lines</span>
        </div>
        <textarea
          name="content"
          bind:value={content}
          rows="16"
          placeholder={"Enter your prompt content here... Use {slot_name} for template variables."}
          class="w-full resize-y bg-transparent p-4 font-mono text-sm text-foreground focus:outline-none"
        ></textarea>
      </div>

      {#if invalid}
        <p role="alert" class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{invalid}</p>
      {/if}

      <div>
        <label for="message" class="mb-1 block text-sm font-medium text-foreground">Commit message</label>
        <input id="message" name="message" bind:value={message} placeholder="Create {fileName || 'new prompt'}"
          class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
      </div>

      <input type="hidden" name="branch" value="main" />
      <Button type="submit" disabled={invalid !== null || !fileName || !content}>Create prompt</Button>

      {#if !data.live}
        <p class="text-xs text-amber-300">No Priompt server configured — this form cannot create anything.</p>
      {/if}
    </div>

    <aside class="space-y-3">
      <div class="rounded-lg border border-border bg-card p-4">
        <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Detected slots <span class="ml-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-blue-300">{slots.length}</span>
        </h2>
        {#if slots.length}
          <ul class="space-y-1">
            {#each slots as s}
              <li><code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{`{${s}}`}</code></li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm text-muted-foreground">No slots detected</p>
        {/if}
      </div>
    </aside>
  </form>
</div>
