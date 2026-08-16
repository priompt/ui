<script lang="ts">
	import { page } from '$app/state';
	import { FileText, History, GitBranch, Settings } from '@lucide/svelte';

	interface Props {
		namespace: string;
	}

	let { namespace }: Props = $props();

	const tabs = $derived([
		{ id: 'code', label: 'Prompts', icon: FileText, href: `/${namespace}` },
		{ id: 'history', label: 'History', icon: History, href: `/${namespace}/commits/main` },
		{ id: 'branches', label: 'Branches', icon: GitBranch, href: `/${namespace}/branches` },
		{ id: 'settings', label: 'Settings', icon: Settings, href: `/${namespace}/settings` }
	] as const);

	const activeTab = $derived(() => {
		const path = page.url.pathname;
		if (path.includes('/commits') || path.includes('/commit/')) return 'history';
		if (path.includes('/branches') || path.includes('/compare/')) return 'branches';
		if (path.includes('/settings')) return 'settings';
		return 'code';
	});
</script>

<nav class="mb-6 border-b border-border/30">
	<div class="flex gap-0">
		{#each tabs as tab}
			{@const isActive = activeTab() === tab.id}
			<a
				href={tab.href}
				class="relative flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors
					{isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}"
			>
				<tab.icon class="h-4 w-4" />
				{tab.label}
				{#if isActive}
					<span class="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-orange-500"></span>
				{/if}
			</a>
		{/each}
	</div>
</nav>
