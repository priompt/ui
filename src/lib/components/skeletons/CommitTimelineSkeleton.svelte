<div class="space-y-4">
  <div class="h-4 w-20 animate-pulse rounded bg-muted"></div>
  {#each Array(3) as _}
    <div class="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
      <div class="h-5 w-5 animate-pulse rounded-full bg-muted"></div>
      <div class="flex-1 space-y-2">
        <div class="h-4 w-48 animate-pulse rounded bg-muted"></div>
        <div class="h-3 w-32 animate-pulse rounded bg-muted"></div>
      </div>
      <div class="h-4 w-16 animate-pulse rounded bg-muted"></div>
    </div>
  {/each}
</div>
