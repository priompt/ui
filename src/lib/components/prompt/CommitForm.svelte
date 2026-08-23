<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import type { Branch } from '$lib/types';

  let {
    open = $bindable(false),
    branches,
    currentBranch,
    onCommit
  }: {
    open: boolean;
    branches: Branch[];
    currentBranch: string;
    onCommit: (data: { message: string; description: string; branch: string }) => void;
  } = $props();

  let message = $state('');
  let description = $state('');
  let selectedBranch = $state(currentBranch);
  let error = $state('');
  let saving = $state(false);

  function handleSubmit() {
    error = '';
    if (!message.trim()) {
      error = 'Commit message is required';
      return;
    }
    saving = true;
    onCommit({ message: message.trim(), description: description.trim(), branch: selectedBranch });
  }

  function handleClose() {
    open = false;
    error = '';
  }
</script>

{#if open}
  <!-- Backdrop -->
  <div class="fixed inset-0 z-50 bg-black/60" onclick={handleClose} role="presentation"></div>

  <!-- Dialog -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      class="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="commit-dialog-title"
    >
      <h2 id="commit-dialog-title" class="text-lg font-semibold text-foreground mb-4">Commit changes</h2>

      <div class="space-y-4">
        <!-- Commit message -->
        <div class="space-y-1.5">
          <input
            type="text"
            bind:value={message}
            maxlength={72}
            placeholder="Commit message"
            class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {#if error}
            <p class="text-xs text-destructive">{error}</p>
          {/if}
          <p class="text-xs text-muted-foreground text-right">{message.length}/72</p>
        </div>

        <!-- Extended description -->
        <textarea
          bind:value={description}
          maxlength={1000}
          placeholder="Add an optional extended description..."
          rows={3}
          class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        ></textarea>

        <!-- Branch selector -->
        <div class="flex items-center gap-3">
          <label for="commit-branch-select" class="text-sm text-muted-foreground">Commit to:</label>
          <select
            id="commit-branch-select"
            bind:value={selectedBranch}
            class="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {#each branches as branch}
              <option value={branch.name}>{branch.name}</option>
            {/each}
          </select>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <Button variant="outline" onclick={handleClose}>Cancel</Button>
          <Button onclick={handleSubmit} disabled={saving}>
            {saving ? 'Committing...' : 'Commit changes'}
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}
