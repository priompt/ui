<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { detectSlots, validateTemplate } from '$lib/utils/slots';
  import { mockBranches, mockPromptContents, mockFolderContents, mockCommits } from '$lib/mocks';
  import { Tag } from '@lucide/svelte';

  const namespace = $derived(page.params.namespace);
  const defaultBranch = $derived(mockBranches.find(b => b.isDefault)?.name ?? 'main');

  let fileName = $state('');
  let folderPath = $state('');
  let content = $state('');
  let commitMessage = $state('');
  let selectedBranch = $state(defaultBranch);
  let error = $state('');

  let detectedSlots = $derived(detectSlots(content));
  let lineCount = $derived(content.split('\n').length);

  // Available folders from mock data
  const folders = $derived(['', ...Object.keys(mockFolderContents)]);

  function handleCreate() {
    error = '';

    if (!fileName.trim()) {
      error = 'File name is required';
      return;
    }

    if (!fileName.endsWith('.prompt')) {
      fileName = fileName + '.prompt';
    }

    if (!commitMessage.trim()) {
      error = 'Commit message is required';
      return;
    }

    // The same rules the server enforces, so the form refuses what a publish
    // would refuse rather than creating an invalid prompt.
    const invalid = validateTemplate(content);
    if (invalid) {
      error = invalid;
      return;
    }

    const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;

    // Add to mock data
    mockPromptContents[fullPath] = {
      path: fullPath,
      branch: selectedBranch,
      content,
      slots: detectedSlots,
      lastCommit: {
        hash: Math.random().toString(36).slice(2, 9),
        message: commitMessage,
        author: 'You',
        date: new Date().toISOString()
      }
    };

    // Add to folder contents
    const newFile = {
      name: fileName,
      path: fullPath,
      type: 'file' as const,
      lastCommit: mockPromptContents[fullPath].lastCommit,
      updatedAt: 'just now'
    };

    if (folderPath && mockFolderContents[folderPath]) {
      mockFolderContents[folderPath].push(newFile);
    }

    // Add commit
    mockCommits.unshift({
      hash: mockPromptContents[fullPath].lastCommit.hash,
      message: commitMessage,
      author: 'You',
      authorAvatar: undefined,
      date: new Date().toISOString(),
      files: [fullPath],
      diff: undefined,
      semanticVerdict: undefined
    });

    // Navigate to the new file
    goto(`/${namespace}/blob/${selectedBranch}/${fullPath}`);
  }
</script>

<svelte:head>
  <title>New prompt — {namespace} — Priompt</title>
</svelte:head>

<div class="max-w-4xl space-y-6">
  <h1 class="text-lg font-semibold text-foreground">Create new prompt</h1>

  <div class="flex gap-6">
    <!-- Main form -->
    <div class="flex-1 space-y-4">
      <!-- File name & folder -->
      <div class="flex gap-3">
        <div class="flex-1 space-y-1.5">
          <label for="file-name" class="text-sm font-medium text-foreground">File name</label>
          <input
            id="file-name"
            type="text"
            bind:value={fileName}
            placeholder="my-prompt.prompt"
            class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div class="w-48 space-y-1.5">
          <label for="folder-path" class="text-sm font-medium text-foreground">Folder</label>
          <select
            id="folder-path"
            bind:value={folderPath}
            class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">/ (root)</option>
            {#each folders.filter(f => f) as folder}
              <option value={folder}>{folder}/</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Content editor -->
      <div class="overflow-hidden rounded-lg border border-border bg-card">
        <div class="flex items-center justify-between border-b border-border px-4 py-2">
          <span class="text-sm font-medium text-foreground">Content</span>
          <span class="text-xs text-muted-foreground">{lineCount} lines</span>
        </div>
        <div class="flex">
          <div class="select-none border-r border-border bg-muted/20 px-3 py-3 text-right font-mono text-xs text-muted-foreground">
            {#each Array(lineCount) as _, i}
              <div class="leading-6">{i + 1}</div>
            {/each}
          </div>
          <textarea
            bind:value={content}
            class="flex-1 resize-none bg-transparent p-3 font-mono text-sm text-foreground leading-6 outline-none"
            rows={Math.max(lineCount + 2, 15)}
            placeholder={"Enter your prompt content here... Use {slot_name} for template variables."}
            spellcheck="false"
          ></textarea>
        </div>
      </div>

      <!-- Commit section -->
      <div class="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 class="text-sm font-semibold text-foreground">Commit new file</h3>
        <div class="space-y-3">
          <input
            type="text"
            bind:value={commitMessage}
            maxlength={72}
            placeholder="Create {fileName || 'new prompt'}"
            class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div class="flex items-center gap-3">
            <label for="new-branch-select" class="text-sm text-muted-foreground">to branch:</label>
            <select
              id="new-branch-select"
              bind:value={selectedBranch}
              class="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {#each mockBranches as branch}
                <option value={branch.name}>{branch.name}</option>
              {/each}
            </select>
          </div>
        </div>

        {#if error}
          <p class="text-xs text-destructive">{error}</p>
        {/if}

        <Button onclick={handleCreate} class="w-full">Create prompt</Button>
      </div>
    </div>

    <!-- Slots panel -->
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
</div>
