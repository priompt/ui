<div class="overflow-hidden rounded-lg border border-border">
  <div class="grid grid-cols-[1fr_1fr_auto_auto] gap-4 border-b border-border bg-card/30 px-4 py-2.5">
    <div class="h-4 w-16 animate-pulse rounded bg-muted"></div>
    <div class="h-4 w-24 animate-pulse rounded bg-muted"></div>
    <div class="h-4 w-16 animate-pulse rounded bg-muted"></div>
    <div class="w-8"></div>
  </div>
  {#each Array(5) as _}
    <div class="grid grid-cols-[1fr_1fr_auto_auto] gap-4 border-b border-border px-4 py-3 last:border-b-0">
      <div class="h-4 w-32 animate-pulse rounded bg-muted"></div>
      <div class="h-4 w-48 animate-pulse rounded bg-muted"></div>
      <div class="h-4 w-20 animate-pulse rounded bg-muted"></div>
      <div class="h-4 w-4 animate-pulse rounded bg-muted"></div>
    </div>
  {/each}
</div>
