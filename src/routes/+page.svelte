<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import DashboardSidebar from '$lib/components/layout/DashboardSidebar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { mockChangelog } from '$lib/mocks';

	let { data } = $props();
</script>

<svelte:head>
	<title>Priompt — Dashboard</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-3.5rem)]">
	<!-- Left sidebar — flush left, secondary bg -->
	<DashboardSidebar />

	<!-- Main content: namespaces + footer -->
	<main class="flex flex-1 flex-col px-8 pt-8">
		<h1 class="mb-6 text-2xl font-normal text-foreground">Namespaces</h1>

		{#if data.offline}
			<p class="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
				Can't reach the priompt server at <code>PRIOMPT_ADDR</code>. Start it with
				<code>priompt serve</code>, then reload.
				<span class="mt-1 block text-xs text-muted-foreground">{data.reason}</span>
			</p>
		{:else if data.namespaces.length === 0}
			<p class="text-sm text-muted-foreground">
				No prompts stored yet. Publish one with <code>priompt put</code>.
			</p>
		{:else}
			<div class="flex flex-col">
				{#each data.namespaces as ns}
					<a href="/{ns.name}" class="group flex items-center gap-3 py-2">
						<span class="text-sm text-muted-foreground">🌐</span>
						<span class="text-sm text-link-blue group-hover:underline">{ns.name}</span>
						<span class="text-xs text-muted-foreground">{ns.promptCount} prompts</span>
					</a>
				{/each}
			</div>
		{/if}

		<!-- Footer inside main content only -->
		<div class="mt-auto">
			<Footer />
		</div>
	</main>

	<!-- Right column: docs CTA + changelog -->
	<aside class="hidden w-80 shrink-0 px-5 pt-8 xl:block">
		<!-- Docs CTA card -->
		<div class="mb-6 overflow-hidden rounded-lg border border-border">
			<div class="flex items-center justify-center bg-gradient-to-r from-purple-900/30 to-emerald-900/30 p-4">
				<span class="text-4xl">🐛🪱🐞</span>
			</div>
			<div class="p-4">
				<p class="mb-3 text-muted-foreground">
					wondering how it works?? checkout the documentation out there
				</p>
				<a
					href="/docs"
					class="flex w-full items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
				>
					open docs
				</a>
			</div>
		</div>

		<!-- Changelog feed — this one has the card bg -->
		<div class="rounded-lg border border-border bg-card p-5">
			<h3 class="mb-4 font-semibold text-foreground">Latest from our changelog</h3>
			<div class="relative ml-3 border-l border-border pl-5">
				{#each mockChangelog as entry}
					<div class="relative mb-5">
						<div class="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-muted-foreground/50"></div>
						<p class="text-sm text-muted-foreground">{entry.relativeTime}</p>
						<a href="/changelog/{entry.id}" class="text-[15px] leading-snug text-link-blue hover:underline">
							{entry.title}
						</a>
					</div>
				{/each}
			</div>
			<a href="/changelog" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-link-blue">
				View changelog <ArrowRight class="h-3.5 w-3.5" />
			</a>
		</div>
	</aside>
</div>
