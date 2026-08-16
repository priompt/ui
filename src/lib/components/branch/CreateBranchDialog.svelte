<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { Branch } from '$lib/types';

	let {
		open = $bindable(false),
		branches,
		onClose,
		onCreate
	}: {
		open: boolean;
		branches: Branch[];
		onClose: () => void;
		onCreate: (name: string, sourceBranch: string) => void;
	} = $props();

	let name = $state('');
	let defaultSource = $derived(
		branches.find((b) => b.isDefault)?.name ?? branches[0]?.name ?? ''
	);
	let sourceBranch = $state('');
	let error = $state('');

	// Reset source branch when dialog opens
	$effect(() => {
		if (open && !sourceBranch) {
			sourceBranch = defaultSource;
		}
	});

	const VALID_CHARS = /^[a-zA-Z0-9\-_./]+$/;

	function validate(): boolean {
		error = '';
		if (!name.trim()) {
			error = 'Branch name is required';
			return false;
		}
		if (!VALID_CHARS.test(name)) {
			error =
				'Branch name can only contain letters, numbers, hyphens, slashes, dots, and underscores';
			return false;
		}
		if (branches.some((b) => b.name === name)) {
			error = 'A branch with this name already exists';
			return false;
		}
		return true;
	}

	function handleSubmit() {
		if (validate()) {
			onCreate(name.trim(), sourceBranch);
			name = '';
			sourceBranch = '';
			error = '';
			open = false;
			onClose();
		}
	}

	function handleClose() {
		name = '';
		sourceBranch = '';
		error = '';
		open = false;
		onClose();
	}
</script>

{#if open}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 bg-black/60" onclick={handleClose} onkeydown={() => {}}></div>

	<!-- Dialog -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
			role="dialog"
			aria-modal="true"
			aria-labelledby="create-branch-title"
			tabindex="-1"
		>
			<h2 id="create-branch-title" class="mb-4 text-lg font-semibold text-foreground">
				Create new branch
			</h2>

			<div class="space-y-4">
				<!-- Branch name -->
				<div class="space-y-1.5">
					<label for="branch-name" class="text-sm font-medium text-foreground">Branch name</label>
					<input
						id="branch-name"
						type="text"
						bind:value={name}
						maxlength={100}
						placeholder="my-feature-branch"
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					/>
					{#if error}
						<p class="text-xs text-destructive">{error}</p>
					{/if}
				</div>

				<!-- Source branch -->
				<div class="space-y-1.5">
					<label for="source-branch" class="text-sm font-medium text-foreground"
						>Source branch</label
					>
					<select
						id="source-branch"
						bind:value={sourceBranch}
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					>
						{#each branches as branch}
							<option value={branch.name}>{branch.name}</option>
						{/each}
					</select>
				</div>

				<!-- Actions -->
				<div class="flex justify-end gap-3 pt-2">
					<Button variant="outline" onclick={handleClose}>Cancel</Button>
					<Button onclick={handleSubmit}>Create branch</Button>
				</div>
			</div>
		</div>
	</div>
{/if}
