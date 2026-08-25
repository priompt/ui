<script lang="ts">
  import { GitCommit } from '@lucide/svelte';
  import type { Commit } from '$lib/types';

  interface Props {
    commits: Commit[];
    namespace: string;
    /** The prompt these commits belong to. A commit is only addressable together
        with its prompt — commit identity includes the URI — so the detail view
        needs it to resolve the commit and diff it against its parent. */
    path?: string;
  }

  let { commits, namespace, path = '' }: Props = $props();

  const commitHref = (hash: string) =>
    path
      ? `/${namespace}/commit/${hash}?path=${encodeURIComponent(path)}`
      : `/${namespace}/commit/${hash}`;

  function getDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  let grouped = $derived(
    (() => {
      const groups: { label: string; commits: Commit[] }[] = [];
      let currentLabel = '';
      for (const commit of commits) {
        const label = getDateLabel(commit.date);
        if (label !== currentLabel) {
          groups.push({ label, commits: [commit] });
          currentLabel = label;
        } else {
          groups[groups.length - 1].commits.push(commit);
        }
      }
      return groups;
    })()
  );
</script>

{#if commits.length === 0}
  <div class="py-12 text-center">
    <GitCommit class="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
    <p class="text-sm text-muted-foreground">No commits yet</p>
  </div>
{:else}
  <div class="space-y-6">
    {#each grouped as group}
      <div>
        <!-- Date header -->
        <div class="flex items-center gap-3 mb-2">
          <span class="text-xs font-medium text-muted-foreground">{group.label}</span>
          <div class="h-px flex-1 bg-border"></div>
        </div>

        <!-- Commits in this group — connected timeline -->
        <div class="relative ml-4 border-l-2 border-border pl-6">
          {#each group.commits as commit}
            <!-- Timeline dot -->
            <div class="absolute -left-2.25 mt-2.5 h-4 w-4 rounded-full border-2 border-border bg-background flex items-center justify-center">
              <div class="h-1.5 w-1.5 rounded-full bg-muted-foreground"></div>
            </div>

            <a
              href={commitHref(commit.hash)}
              class="group block pb-4"
            >
              <div class="flex items-baseline justify-between gap-4">
                <p class="text-sm text-foreground group-hover:text-link-blue transition-colors">{commit.message}</p>
                <code class="shrink-0 font-mono text-xs text-muted-foreground group-hover:text-link-blue transition-colors">{commit.hash.slice(0, 7)}</code>
              </div>
              <p class="mt-0.5 text-xs text-muted-foreground">
                {commit.author} · {getRelativeTime(commit.date)}
                {#if commit.files.length > 0}
                  · {commit.files.length} file{commit.files.length !== 1 ? 's' : ''}
                {/if}
              </p>
            </a>
          {/each}
        </div>
      </div>
    {/each}
  </div>
{/if}
