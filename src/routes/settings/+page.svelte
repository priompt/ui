<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Settings } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let serverUrl = $state('');
	let defaultNamespace = $state('');
	let theme = $state<'dark' | 'light'>('dark');
	let message = $state('');
	let messageType = $state<'success' | 'error'>('success');

	onMount(() => {
		// Load persisted values
		serverUrl = localStorage.getItem('priompt-server-url') ?? '';
		defaultNamespace = localStorage.getItem('priompt-default-namespace') ?? '';
		theme = (localStorage.getItem('priompt-theme') as 'dark' | 'light') ?? 'dark';
	});

	function isValidUrl(url: string): boolean {
		if (!url) return false;
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	function handleSave() {
		message = '';
		try {
			localStorage.setItem('priompt-server-url', serverUrl);
			localStorage.setItem('priompt-default-namespace', defaultNamespace);
			localStorage.setItem('priompt-theme', theme);
			message = 'Settings saved successfully';
			messageType = 'success';
		} catch {
			message = 'Failed to save settings';
			messageType = 'error';
		}
	}

	let canSave = $derived(!serverUrl || isValidUrl(serverUrl));
</script>

<svelte:head>
	<title>Settings — Priompt</title>
</svelte:head>

<div class="mx-auto max-w-lg space-y-6">
	<div class="flex items-center gap-3">
		<Settings class="h-6 w-6 text-muted-foreground" />
		<h1 class="text-lg font-semibold text-foreground">Settings</h1>
	</div>

	<div class="space-y-6 rounded-lg border border-border bg-card p-6">
		<!-- Server URL -->
		<div class="space-y-1.5">
			<label for="settings-server-url" class="text-sm font-medium text-foreground"
				>Server URL</label
			>
			<input
				id="settings-server-url"
				type="text"
				bind:value={serverUrl}
				maxlength={2048}
				placeholder="http://localhost:3000"
				class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
			/>
			{#if serverUrl && !isValidUrl(serverUrl)}
				<p class="text-xs text-destructive">Please enter a valid URL</p>
			{/if}
		</div>

		<!-- Default namespace -->
		<div class="space-y-1.5">
			<label for="settings-namespace" class="text-sm font-medium text-foreground"
				>Default Namespace</label
			>
			<input
				id="settings-namespace"
				type="text"
				bind:value={defaultNamespace}
				maxlength={128}
				placeholder="acme"
				class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
			/>
		</div>

		<!-- Theme -->
		<div class="space-y-1.5">
			<label for="settings-theme" class="text-sm font-medium text-foreground">Theme</label>
			<select
				id="settings-theme"
				bind:value={theme}
				class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
			>
				<option value="dark">Dark</option>
				<option value="light">Light</option>
			</select>
		</div>

		<!-- Save -->
		{#if message}
			<p class="text-sm {messageType === 'success' ? 'text-green-400' : 'text-destructive'}">
				{message}
			</p>
		{/if}

		<Button onclick={handleSave} disabled={!canSave} class="w-full">Save settings</Button>
	</div>
</div>
