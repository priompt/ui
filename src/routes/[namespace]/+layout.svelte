<script lang="ts">
	import { page } from '$app/state';
	import NamespaceHeader from '$lib/components/namespace/NamespaceHeader.svelte';
	import NamespaceTabs from '$lib/components/namespace/NamespaceTabs.svelte';

	let { children } = $props();

	// page.params values are string | undefined; this layout only renders under
	// [namespace], so the param is always present.
	const namespace = $derived(page.params.namespace ?? '');
</script>

<div class="mx-auto w-full max-w-6xl px-6 py-6">
	<NamespaceHeader name={namespace} />
	<NamespaceTabs {namespace} />
	{@render children()}
</div>
