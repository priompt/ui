<script lang="ts">
	import BreadcrumbNav from '$lib/components/namespace/BreadcrumbNav.svelte';
	import FileTable from '$lib/components/namespace/FileTable.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.folderPath || data.namespace} — Priompt</title>
</svelte:head>

<div class="space-y-4">
	<BreadcrumbNav
		namespace={data.namespace}
		branch={data.branch}
		pathSegments={data.pathSegments}
	/>

	<FileTable files={data.files} namespace={data.namespace} branch={data.branch} />
</div>
