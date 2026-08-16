<script lang="ts">
	import { Menu, GitPullRequest, Inbox, Plus } from '@lucide/svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { Kbd } from '$lib/components/ui/kbd';
	import SearchDialog from './SearchDialog.svelte';
	import { toggleSidebar } from '$lib/stores/mobile-sidebar.svelte';

	let searchOpen = $state(false);
</script>

<svelte:window
	onkeydown={(e) => {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			searchOpen = !searchOpen;
		}
	}}
/>

<header class="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-[#010409] px-4">
	<!-- Left section: hamburger + logo -->
	<div class="flex items-center gap-4">
		<Button
			variant="ghost"
			size="icon"
			class="h-11 w-11 min-h-11 min-w-11 text-muted-foreground hover:text-foreground md:h-8 md:w-8 md:min-h-0 md:min-w-0"
			onclick={toggleSidebar}
			aria-label="Toggle sidebar menu"
		>
			<Menu class="h-4 w-4" />
		</Button>

		<a href="/" class="flex items-center gap-2 text-foreground">
			<svg class="h-8 w-8" viewBox="0 0 32 32" fill="currentColor">
				<circle cx="16" cy="16" r="14" fill="currentColor" />
				<text x="16" y="21" text-anchor="middle" font-size="14" font-weight="bold" fill="#010409">P</text>
			</svg>
			<span class="text-sm font-bold">Dashboard</span>
		</a>
	</div>

	<!-- Center section: search bar -->
	<div class="hidden md:block">
		<button
			onclick={() => (searchOpen = true)}
			class="flex h-8 w-72 items-center gap-2 rounded-md border border-border bg-transparent px-3 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/50"
		>
			<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
				<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
			</svg>
			<span class="flex-1 text-left">Type <Kbd class="ml-1 text-xs">/</Kbd> to search</span>
		</button>
	</div>

	<!-- Right section: actions + avatar -->
	<div class="flex items-center gap-1">
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground">
					<Plus class="h-4 w-4" />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content><p>Create new</p></Tooltip.Content>
		</Tooltip.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground">
					<GitPullRequest class="h-4 w-4" />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content><p>Pull requests</p></Tooltip.Content>
		</Tooltip.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground">
					<Inbox class="h-4 w-4" />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content><p>Inbox</p></Tooltip.Content>
		</Tooltip.Root>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="ml-2">
				<Avatar.Root class="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-muted-foreground/50">
					<Avatar.Image src="https://avatars.githubusercontent.com/u/86828576" alt="User" />
					<Avatar.Fallback>U</Avatar.Fallback>
				</Avatar.Root>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-56">
				<DropdownMenu.Label>My Account</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>Your profile</DropdownMenu.Item>
				<DropdownMenu.Item>Your namespaces</DropdownMenu.Item>
				<DropdownMenu.Item>Settings</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>Sign out</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>

<SearchDialog bind:open={searchOpen} />
