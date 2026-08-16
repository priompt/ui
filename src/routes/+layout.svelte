<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Tooltip.Provider>
	<div class="flex min-h-screen flex-col bg-background">
		<Navbar />
		{@render children()}
	</div>
</Tooltip.Provider>
