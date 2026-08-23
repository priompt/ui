<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { 
    Settings, Trash2, GitBranch, Shield, Globe, Lock, 
    Webhook, Bell, Zap, Archive, RotateCcw 
  } from '@lucide/svelte';
  import { mockBranches } from '$lib/mocks';

  const namespace = $derived(page.params.namespace);
  
  // General
  let description = $state('Prompt namespace managed by the engineering team. Contains production-ready prompts for customer-facing AI interactions.');
  let websiteUrl = $state('');
  let topics = $state('prompts, ai, customer-support, onboarding');
  
  // Branches
  let defaultBranch = $state(mockBranches.find(b => b.isDefault)?.name ?? 'main');
  let servingBranch = $state(mockBranches.find(b => b.isServing)?.name ?? 'main');
  let protectMain = $state(true);
  let requireReviews = $state(true);
  let minReviewers = $state(1);
  
  // Access & Visibility
  let visibility = $state<'private' | 'public'>('private');
  let allowForks = $state(false);
  
  // Notifications
  let notifyOnCommit = $state(true);
  let notifyOnBranchCreate = $state(false);
  let notifyOnServing = $state(true);
  
  // Serving
  let autoServe = $state(false);
  let servingEndpoint = $state('https://api.priompt.dev/v1/serve/acme');
  let rateLimitPerMin = $state(100);
  let cacheTtlSeconds = $state(300);
  
  // Webhooks
  let webhookUrl = $state('');
  let webhookEvents = $state<string[]>(['push', 'serving']);
  
  // Feedback
  let saved = $state(false);
  let savedSection = $state('');

  function handleSave(section: string) {
    saved = true;
    savedSection = section;
    setTimeout(() => { saved = false; savedSection = ''; }, 2000);
  }

  function showSaved(section: string): boolean {
    return saved && savedSection === section;
  }
</script>

<svelte:head>
  <title>Settings — {namespace} — Priompt</title>
</svelte:head>

<div class="max-w-3xl space-y-8 pb-12">
  <!-- Page header -->
  <div class="border-b border-border pb-4">
    <h1 class="text-xl font-semibold text-foreground">Settings</h1>
    <p class="mt-1 text-sm text-muted-foreground">Manage configuration for the <span class="font-mono font-medium text-foreground">{namespace}</span> namespace</p>
  </div>

  <!-- GENERAL -->
  <section class="space-y-4">
    <div class="flex items-center gap-2">
      <Settings class="h-4 w-4 text-muted-foreground" />
      <h2 class="text-sm font-semibold text-foreground">General</h2>
    </div>
    
    <div class="rounded-lg border border-border bg-card">
      <!-- Namespace name -->
      <div class="border-b border-border p-4">
        <div class="flex items-center justify-between">
          <div>
            <label for="ns-name" class="text-sm font-medium text-foreground">Namespace name</label>
            <p class="text-xs text-muted-foreground mt-0.5">Used in URLs and API references. Cannot be changed.</p>
          </div>
          <input
            id="ns-name"
            type="text"
            value={namespace}
            disabled
            class="w-56 rounded-md border border-border bg-muted/20 px-3 py-1.5 text-sm text-muted-foreground"
          />
        </div>
      </div>
      
      <!-- Description -->
      <div class="border-b border-border p-4 space-y-2">
        <label for="ns-desc" class="text-sm font-medium text-foreground">Description</label>
        <textarea
          id="ns-desc"
          bind:value={description}
          rows={2}
          placeholder="Describe what this namespace is for..."
          class="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        ></textarea>
      </div>

      <!-- Website -->
      <div class="border-b border-border p-4 space-y-2">
        <label for="ns-website" class="text-sm font-medium text-foreground">Website</label>
        <input
          id="ns-website"
          type="url"
          bind:value={websiteUrl}
          placeholder="https://docs.example.com/prompts"
          class="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <!-- Topics -->
      <div class="p-4 space-y-2">
        <label for="ns-topics" class="text-sm font-medium text-foreground">Topics</label>
        <p class="text-xs text-muted-foreground">Comma-separated tags for discoverability</p>
        <input
          id="ns-topics"
          type="text"
          bind:value={topics}
          placeholder="prompts, ai, support"
          class="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>

    <div class="flex items-center gap-3">
      <Button size="sm" onclick={() => handleSave('general')}>Save</Button>
      {#if showSaved('general')}
        <span class="text-xs text-green-400">Saved</span>
      {/if}
    </div>
  </section>

  <!-- BRANCHES & PROTECTION -->
  <section class="space-y-4">
    <div class="flex items-center gap-2">
      <GitBranch class="h-4 w-4 text-muted-foreground" />
      <h2 class="text-sm font-semibold text-foreground">Branches &amp; Protection</h2>
    </div>

    <div class="rounded-lg border border-border bg-card">
      <!-- Default branch -->
      <div class="border-b border-border p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Default branch</span>
            <p class="text-xs text-muted-foreground mt-0.5">The base branch for new PRs and the default view</p>
          </div>
          <select
            bind:value={defaultBranch}
            class="w-40 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {#each mockBranches as branch}
              <option value={branch.name}>{branch.name}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Serving branch -->
      <div class="border-b border-border p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Serving branch</span>
            <p class="text-xs text-muted-foreground mt-0.5">Prompts on this branch are served to production agents</p>
          </div>
          <select
            bind:value={servingBranch}
            class="w-40 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {#each mockBranches as branch}
              <option value={branch.name}>{branch.name}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Branch protection -->
      <div class="border-b border-border p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Protect default branch</span>
            <p class="text-xs text-muted-foreground mt-0.5">Prevent direct pushes to the default branch</p>
          </div>
          <button
            onclick={() => protectMain = !protectMain}
            class="relative h-5 w-9 rounded-full transition-colors {protectMain ? 'bg-green-500' : 'bg-muted-foreground/30'}"
            role="switch"
            aria-checked={protectMain}
            aria-label="Protect default branch"
          >
            <span class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform {protectMain ? 'translate-x-4' : ''}"></span>
          </button>
        </div>
      </div>

      <!-- Require reviews -->
      <div class="border-b border-border p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Require pull request reviews</span>
            <p class="text-xs text-muted-foreground mt-0.5">Changes must be reviewed before merging</p>
          </div>
          <button
            onclick={() => requireReviews = !requireReviews}
            class="relative h-5 w-9 rounded-full transition-colors {requireReviews ? 'bg-green-500' : 'bg-muted-foreground/30'}"
            role="switch"
            aria-checked={requireReviews}
            aria-label="Require pull request reviews"
          >
            <span class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform {requireReviews ? 'translate-x-4' : ''}"></span>
          </button>
        </div>
      </div>

      <!-- Min reviewers -->
      {#if requireReviews}
        <div class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm font-medium text-foreground">Minimum reviewers</span>
              <p class="text-xs text-muted-foreground mt-0.5">Required approvals before merge</p>
            </div>
            <input
              type="number"
              bind:value={minReviewers}
              min={1}
              max={5}
              class="w-16 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-3">
      <Button size="sm" onclick={() => handleSave('branches')}>Save</Button>
      {#if showSaved('branches')}
        <span class="text-xs text-green-400">Saved</span>
      {/if}
    </div>
  </section>

  <!-- SERVING & DEPLOYMENT -->
  <section class="space-y-4">
    <div class="flex items-center gap-2">
      <Zap class="h-4 w-4 text-muted-foreground" />
      <h2 class="text-sm font-semibold text-foreground">Serving &amp; Deployment</h2>
    </div>

    <div class="rounded-lg border border-border bg-card">
      <!-- Endpoint -->
      <div class="border-b border-border p-4 space-y-2">
        <span class="text-sm font-medium text-foreground">Serving endpoint</span>
        <p class="text-xs text-muted-foreground">Agents resolve prompts from this URL</p>
        <div class="flex items-center gap-2">
          <input
            type="text"
            value={servingEndpoint}
            disabled
            class="flex-1 rounded-md border border-border bg-muted/20 px-3 py-1.5 font-mono text-xs text-muted-foreground"
          />
          <Button variant="outline" size="sm" onclick={() => navigator.clipboard.writeText(servingEndpoint)}>Copy</Button>
        </div>
      </div>

      <!-- Auto-serve -->
      <div class="border-b border-border p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Auto-deploy on merge</span>
            <p class="text-xs text-muted-foreground mt-0.5">Automatically update serving when changes are merged to the serving branch</p>
          </div>
          <button
            onclick={() => autoServe = !autoServe}
            class="relative h-5 w-9 rounded-full transition-colors {autoServe ? 'bg-green-500' : 'bg-muted-foreground/30'}"
            role="switch"
            aria-checked={autoServe}
            aria-label="Auto-deploy on merge"
          >
            <span class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform {autoServe ? 'translate-x-4' : ''}"></span>
          </button>
        </div>
      </div>

      <!-- Rate limit -->
      <div class="border-b border-border p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Rate limit</span>
            <p class="text-xs text-muted-foreground mt-0.5">Max requests per minute to the serving endpoint</p>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="number"
              bind:value={rateLimitPerMin}
              min={1}
              max={10000}
              class="w-20 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground">req/min</span>
          </div>
        </div>
      </div>

      <!-- Cache TTL -->
      <div class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Cache TTL</span>
            <p class="text-xs text-muted-foreground mt-0.5">How long resolved prompts are cached at the edge</p>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="number"
              bind:value={cacheTtlSeconds}
              min={0}
              max={86400}
              class="w-20 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground">seconds</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <Button size="sm" onclick={() => handleSave('serving')}>Save</Button>
      {#if showSaved('serving')}
        <span class="text-xs text-green-400">Saved</span>
      {/if}
    </div>
  </section>

  <!-- ACCESS & VISIBILITY -->
  <section class="space-y-4">
    <div class="flex items-center gap-2">
      <Shield class="h-4 w-4 text-muted-foreground" />
      <h2 class="text-sm font-semibold text-foreground">Access &amp; Visibility</h2>
    </div>

    <div class="rounded-lg border border-border bg-card">
      <!-- Visibility -->
      <div class="border-b border-border p-4">
        <span class="text-sm font-medium text-foreground mb-3 block">Namespace visibility</span>
        <div class="space-y-3">
          <label class="flex items-start gap-3 cursor-pointer">
            <input type="radio" bind:group={visibility} value="private" class="mt-1 accent-green-500" />
            <div>
              <div class="flex items-center gap-1.5">
                <Lock class="h-3.5 w-3.5 text-muted-foreground" />
                <span class="text-sm font-medium text-foreground">Private</span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">Only people with access can view and edit prompts</p>
            </div>
          </label>
          <label class="flex items-start gap-3 cursor-pointer">
            <input type="radio" bind:group={visibility} value="public" class="mt-1 accent-green-500" />
            <div>
              <div class="flex items-center gap-1.5">
                <Globe class="h-3.5 w-3.5 text-muted-foreground" />
                <span class="text-sm font-medium text-foreground">Public</span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">Anyone can view prompts. Only collaborators can edit.</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Allow forks -->
      <div class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Allow forking</span>
            <p class="text-xs text-muted-foreground mt-0.5">Other users can fork this namespace to their own account</p>
          </div>
          <button
            onclick={() => allowForks = !allowForks}
            class="relative h-5 w-9 rounded-full transition-colors {allowForks ? 'bg-green-500' : 'bg-muted-foreground/30'}"
            role="switch"
            aria-checked={allowForks}
            aria-label="Allow forking"
          >
            <span class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform {allowForks ? 'translate-x-4' : ''}"></span>
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <Button size="sm" onclick={() => handleSave('access')}>Save</Button>
      {#if showSaved('access')}
        <span class="text-xs text-green-400">Saved</span>
      {/if}
    </div>
  </section>

  <!-- NOTIFICATIONS -->
  <section class="space-y-4">
    <div class="flex items-center gap-2">
      <Bell class="h-4 w-4 text-muted-foreground" />
      <h2 class="text-sm font-semibold text-foreground">Notifications</h2>
    </div>

    <div class="rounded-lg border border-border bg-card">
      <div class="border-b border-border p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Notify on commit</span>
            <p class="text-xs text-muted-foreground mt-0.5">Get notified when commits are pushed to the serving branch</p>
          </div>
          <button
            onclick={() => notifyOnCommit = !notifyOnCommit}
            class="relative h-5 w-9 rounded-full transition-colors {notifyOnCommit ? 'bg-green-500' : 'bg-muted-foreground/30'}"
            role="switch"
            aria-checked={notifyOnCommit}
            aria-label="Notify on commit"
          >
            <span class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform {notifyOnCommit ? 'translate-x-4' : ''}"></span>
          </button>
        </div>
      </div>

      <div class="border-b border-border p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Notify on branch creation</span>
            <p class="text-xs text-muted-foreground mt-0.5">Alert when new branches are created</p>
          </div>
          <button
            onclick={() => notifyOnBranchCreate = !notifyOnBranchCreate}
            class="relative h-5 w-9 rounded-full transition-colors {notifyOnBranchCreate ? 'bg-green-500' : 'bg-muted-foreground/30'}"
            role="switch"
            aria-checked={notifyOnBranchCreate}
            aria-label="Notify on branch creation"
          >
            <span class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform {notifyOnBranchCreate ? 'translate-x-4' : ''}"></span>
          </button>
        </div>
      </div>

      <div class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Notify on serving change</span>
            <p class="text-xs text-muted-foreground mt-0.5">Alert when the serving branch pointer changes</p>
          </div>
          <button
            onclick={() => notifyOnServing = !notifyOnServing}
            class="relative h-5 w-9 rounded-full transition-colors {notifyOnServing ? 'bg-green-500' : 'bg-muted-foreground/30'}"
            role="switch"
            aria-checked={notifyOnServing}
            aria-label="Notify on serving change"
          >
            <span class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform {notifyOnServing ? 'translate-x-4' : ''}"></span>
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- WEBHOOKS -->
  <section class="space-y-4">
    <div class="flex items-center gap-2">
      <Webhook class="h-4 w-4 text-muted-foreground" />
      <h2 class="text-sm font-semibold text-foreground">Webhooks</h2>
    </div>

    <div class="rounded-lg border border-border bg-card p-4 space-y-4">
      <div class="space-y-2">
        <label for="webhook-url" class="text-sm font-medium text-foreground">Payload URL</label>
        <input
          id="webhook-url"
          type="url"
          bind:value={webhookUrl}
          placeholder="https://example.com/hooks/priompt"
          class="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div class="space-y-2">
        <span class="text-sm font-medium text-foreground">Events</span>
        <div class="grid grid-cols-2 gap-2">
          {#each ['push', 'branch_create', 'branch_delete', 'serving', 'tag', 'review'] as event}
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={webhookEvents.includes(event)}
                onchange={() => {
                  if (webhookEvents.includes(event)) {
                    webhookEvents = webhookEvents.filter(e => e !== event);
                  } else {
                    webhookEvents = [...webhookEvents, event];
                  }
                }}
                class="rounded border-border accent-green-500"
              />
              <span class="text-sm text-foreground">{event.replace('_', ' ')}</span>
            </label>
          {/each}
        </div>
      </div>

      <Button size="sm" variant="outline" onclick={() => handleSave('webhooks')}>
        {webhookUrl ? 'Update webhook' : 'Add webhook'}
      </Button>
    </div>
  </section>

  <!-- DANGER ZONE -->
  <section class="space-y-4">
    <div class="flex items-center gap-2">
      <Trash2 class="h-4 w-4 text-destructive" />
      <h2 class="text-sm font-semibold text-destructive">Danger zone</h2>
    </div>

    <div class="rounded-lg border border-destructive/30 bg-card divide-y divide-destructive/20">
      <!-- Archive -->
      <div class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Archive this namespace</span>
            <p class="text-xs text-muted-foreground mt-0.5">Mark as read-only. Can be unarchived later.</p>
          </div>
          <Button variant="outline" size="sm" class="border-destructive/50 text-destructive hover:bg-destructive/10">
            <Archive class="mr-1.5 h-3.5 w-3.5" />
            Archive
          </Button>
        </div>
      </div>

      <!-- Transfer -->
      <div class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Transfer ownership</span>
            <p class="text-xs text-muted-foreground mt-0.5">Move this namespace to another organization</p>
          </div>
          <Button variant="outline" size="sm" class="border-destructive/50 text-destructive hover:bg-destructive/10">
            <RotateCcw class="mr-1.5 h-3.5 w-3.5" />
            Transfer
          </Button>
        </div>
      </div>

      <!-- Delete -->
      <div class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-foreground">Delete this namespace</span>
            <p class="text-xs text-muted-foreground mt-0.5">Permanently remove all prompts, branches, and history. This cannot be undone.</p>
          </div>
          <Button variant="destructive" size="sm">
            <Trash2 class="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  </section>
</div>
