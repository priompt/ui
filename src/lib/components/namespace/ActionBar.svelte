<script lang="ts">
	import { Plus, Upload, MoreHorizontal } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	interface Props {
		namespace?: string;
	}

	let { namespace = '' }: Props = $props();
</script>

<div class="flex items-center gap-2">
	<Button variant="outline" size="sm" class="h-8 gap-1.5" href="/{namespace}/new">
		<Plus class="h-3.5 w-3.5" />
		New prompt
	</Button>
	<Button variant="outline" size="sm" class="h-8 gap-1.5">
		<Upload class="h-3.5 w-3.5" />
		Upload
	</Button>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button variant="outline" size="icon" class="h-8 w-8">
				<MoreHorizontal class="h-4 w-4" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Item>Clone namespace</DropdownMenu.Item>
			<DropdownMenu.Item>Download as ZIP</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item class="text-destructive">Delete namespace</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
