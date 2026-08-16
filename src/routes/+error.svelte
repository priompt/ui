<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { AlertCircle } from '@lucide/svelte';
</script>

<svelte:head>
	<title>{page.status} — Priompt</title>
</svelte:head>

<div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
	<!-- SVG Illustration / Icon -->
	<AlertCircle class="mb-6 h-16 w-16 text-muted-foreground" />

	<!-- Status code -->
	<h1 class="text-6xl font-bold text-foreground">{page.status}</h1>

	<!-- Heading -->
	<h2 class="mt-4 text-xl font-semibold text-foreground">
		{page.status === 404 ? 'Page not found' : 'Something went wrong'}
	</h2>

	<!-- Description -->
	<p class="mt-2 max-w-sm text-sm text-muted-foreground">
		{page.error?.message ?? "The page you're looking for doesn't exist or has been moved."}
	</p>

	<!-- Go to Dashboard -->
	<Button href="/" variant="outline" class="mt-8">
		Go to Dashboard
	</Button>
</div>
