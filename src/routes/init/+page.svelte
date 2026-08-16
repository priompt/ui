<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Zap } from '@lucide/svelte';

	let serverUrl = $state('');
	let error = $state('');
	let connecting = $state(false);

	async function handleConnect() {
		error = '';

		if (!serverUrl.trim()) {
			error = 'A server URL is required';
			return;
		}

		if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
			error = 'URL must begin with http:// or https://';
			return;
		}

		if (serverUrl.length > 2048) {
			error = 'URL must be 2048 characters or fewer';
			return;
		}

		connecting = true;

		// Simulate connection attempt
		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			localStorage.setItem('priompt-server-url', serverUrl);
			goto('/');
		} catch (e) {
			error = 'Connection failed. Please check the URL and try again.';
			connecting = false;
		}
	}
</script>

<svelte:head>
	<title>Connect — Priompt</title>
</svelte:head>

<div class="flex min-h-[80vh] items-center justify-center">
	<div class="w-full max-w-sm space-y-8 text-center">
		<!-- Logo -->
		<div class="space-y-2">
			<div class="flex items-center justify-center gap-2">
				<Zap class="h-8 w-8 text-foreground" />
				<span class="text-2xl font-bold tracking-tight text-foreground">priompt</span>
			</div>
			<p class="text-sm text-muted-foreground">Connect to your Priompt server to get started</p>
		</div>

		<!-- Form -->
		<div class="space-y-4">
			<div class="space-y-1.5 text-left">
				<label for="server-url" class="text-sm font-medium text-foreground">Server URL</label>
				<input
					id="server-url"
					type="text"
					bind:value={serverUrl}
					placeholder="http://localhost:3000"
					class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				{#if error}
					<p class="text-xs text-destructive">{error}</p>
				{/if}
			</div>

			<Button onclick={handleConnect} disabled={connecting} class="w-full">
				{connecting ? 'Connecting...' : 'Connect'}
			</Button>
		</div>
	</div>
</div>
