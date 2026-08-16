<div class="space-y-1">
  {#each Array(3) as _}
    <div class="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <div class="h-5 w-5 animate-pulse rounded bg-muted"></div>
      <div class="flex-1 space-y-2">
        <div class="h-4 w-24 animate-pulse rounded bg-muted"></div>
        <div class="h-3 w-48 animate-pulse rounded bg-muted"></div>
      </div>
    </div>
  {/each}
</div>
