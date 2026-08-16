<div class="overflow-hidden rounded-lg border border-border bg-card">
  <div class="flex items-center justify-between border-b border-border px-4 py-2">
    <div class="h-4 w-32 animate-pulse rounded bg-muted"></div>
    <div class="h-4 w-16 animate-pulse rounded bg-muted"></div>
  </div>
  <div class="p-4 space-y-3">
    {#each Array(3) as _}
      <div class="flex gap-3">
        <div class="h-4 w-8 animate-pulse rounded bg-muted"></div>
        <div class="h-4 flex-1 animate-pulse rounded bg-muted"></div>
      </div>
    {/each}
  </div>
</div>
