<script lang="ts">
	import { enhance } from '$app/forms';
	import { GitBranch, GitMerge, RotateCcw, ArrowUpRight } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import CreateBranchDialog from '$lib/components/branch/CreateBranchDialog.svelte';

	let { data, form } = $props();

	let showCreate = $state(false);
	let selected = $state(data.path);
	let promoteFrom = $state('dev');
	let promoteTo = $state('prod');
	let mergeFrom = $state('dev');

	const branchNames = $derived(data.branches.map((b) => b.name));

	function choose(path: string) {
		selected = path;
		const qs = new URLSearchParams(path ? { path } : {});
		location.href = `/${data.namespace}/branches${qs.toString() ? `?${qs}` : ''}`;
	}
</script>

<svelte:head><title>Branches — {data.namespace} — Priompt</title></svelte:head>

<div class="space-y-5">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-lg font-semibold text-foreground">Branches</h1>
		{#if data.live && data.path}
			<Button onclick={() => (showCreate = true)}>
				<GitBranch class="mr-1.5 h-4 w-4" /> New branch
			</Button>
		{/if}
	</div>

	{#if form?.error}
		<p role="alert" class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
			{form.error}
			{#if form.retryable}<span class="block text-xs opacity-80">Safe to retry — nothing was lost.</span>{/if}
		</p>
	{:else if form?.ok}
		<p role="status" class="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
			{form.ok}
		</p>
	{/if}

	{#if data.live}
		<!-- Branches are per prompt: each prompt carries its own refs and its own
		     independent history, so a namespace-wide branch list would be a fiction. -->
		<div class="rounded-lg border border-border bg-card p-4">
			<label for="prompt-picker" class="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Prompt
			</label>
			<select
				id="prompt-picker"
				class="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground"
				value={selected}
				onchange={(e) => choose((e.currentTarget as HTMLSelectElement).value)}
			>
				<option value="">Select a prompt…</option>
				{#each data.prompts as p}
					<option value={p}>{p}</option>
				{/each}
			</select>
			<p class="mt-2 text-xs text-muted-foreground">
				Branches, merges and rollbacks all act on one prompt — that is how Priompt models them.
			</p>
		</div>
	{/if}

	{#if data.error}
		<p role="alert" class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{data.error}</p>
	{/if}

	{#if !data.live || data.path}
		<div class="rounded-lg border border-border bg-card">
			{#each data.branches as b}
				<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<GitBranch class="h-4 w-4 text-muted-foreground" />
							<span class="font-mono text-sm text-foreground">{b.name}</span>
							{#if b.isDefault}<span class="rounded bg-muted px-1.5 text-[11px] text-muted-foreground">default</span>{/if}
							{#if b.isServing}<span class="rounded bg-emerald-500/15 px-1.5 text-[11px] text-emerald-300">serving</span>{/if}
						</div>
						{#if b.lastCommit?.message}
							<p class="mt-0.5 truncate text-xs text-muted-foreground">
								{b.lastCommit.message} · {b.lastCommit.author}
							</p>
						{/if}
					</div>
					{#if data.live && data.path && !b.isDefault}
						<form method="POST" action="?/merge" use:enhance class="flex items-center gap-2">
							<input type="hidden" name="path" value={data.path} />
							<input type="hidden" name="from" value={b.name} />
							<input type="hidden" name="into" value="main" />
							<Button type="submit" variant="outline" size="sm">
								<GitMerge class="mr-1.5 h-3.5 w-3.5" /> Merge into main
							</Button>
						</form>
					{/if}
				</div>
			{:else}
				<p class="px-4 py-6 text-sm text-muted-foreground">
					{data.live && !data.path ? 'Select a prompt to see its branches.' : 'No branches found.'}
				</p>
			{/each}
		</div>
	{/if}

	{#if data.live && data.path}
		<!-- Promote: dev -> staging -> prod, the environments model promptctl uses.
		     Over the API that is a merge, creating the target branch if this prompt
		     has never been promoted there. -->
		<section class="rounded-lg border border-border bg-card p-4">
			<h2 class="mb-1 text-sm font-semibold text-foreground">Promote</h2>
			<p class="mb-3 text-xs text-muted-foreground">
				Move this prompt from one environment onto another — the deliberate, recorded step.
			</p>
			<form method="POST" action="?/promote" use:enhance class="flex flex-wrap items-end gap-3">
				<input type="hidden" name="path" value={data.path} />
				<div>
					<label for="pf" class="mb-1 block text-xs text-muted-foreground">From</label>
					<select id="pf" name="from" bind:value={promoteFrom} class="rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm">
						{#each data.known as n}<option value={n}>{n}</option>{/each}
					</select>
				</div>
				<ArrowUpRight class="mb-2 h-4 w-4 text-muted-foreground" />
				<div>
					<label for="pt" class="mb-1 block text-xs text-muted-foreground">To</label>
					<select id="pt" name="to" bind:value={promoteTo} class="rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm">
						{#each data.known as n}<option value={n}>{n}</option>{/each}
					</select>
				</div>
				<Button type="submit" variant="outline">Promote</Button>
			</form>
		</section>

		<!-- Rollback: move main back to an earlier commit. Nothing is deleted; the
		     branch pointer moves, and every reader sees it on the next fetch. -->
		<section class="rounded-lg border border-border bg-card p-4">
			<h2 class="mb-1 text-sm font-semibold text-foreground">Rollback</h2>
			<p class="mb-3 text-xs text-muted-foreground">
				Point <code class="font-mono">main</code> at an earlier commit. Nothing is deleted — the pointer moves, and agents pick it up immediately.
			</p>
			<div class="divide-y divide-border/60">
				{#each data.commits as c, i}
					<div class="flex flex-wrap items-center justify-between gap-3 py-2">
						<div class="min-w-0">
							<span class="font-mono text-xs text-muted-foreground">{c.hash}</span>
							<span class="ml-2 text-sm text-foreground">{c.message}</span>
							<span class="ml-2 text-xs text-muted-foreground">{c.author}</span>
						</div>
						{#if i === 0}
							<span class="text-xs text-emerald-300">current</span>
						{:else}
							<form method="POST" action="?/rollback" use:enhance>
								<input type="hidden" name="path" value={data.path} />
								<input type="hidden" name="commit" value={c.fullHash} />
								<input type="hidden" name="branch" value="main" />
								<Button type="submit" variant="outline" size="sm">
									<RotateCcw class="mr-1.5 h-3.5 w-3.5" /> Roll back to here
								</Button>
							</form>
						{/if}
					</div>
				{:else}
					<p class="py-2 text-sm text-muted-foreground">No commits on main.</p>
				{/each}
			</div>
		</section>
	{/if}
</div>

{#if data.live && data.path}
	<CreateBranchDialog
		bind:open={showCreate}
		branches={branchNames.length ? branchNames : data.known}
		defaultBranch="main"
		promptPath={data.path}
	/>
{/if}
