<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import DataSourceBanner from '$lib/components/layout/DataSourceBanner.svelte';

	let { children, data } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Tooltip.Provider>
	<div class="flex min-h-screen flex-col overflow-x-hidden bg-background">
		<DataSourceBanner live={data?.live ?? false} />
		<Navbar />
		{@render children()}
	</div>
</Tooltip.Provider>
