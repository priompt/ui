<script lang="ts">
  import CommitDetail from '$lib/components/history/CommitDetail.svelte';
  import SemanticVerdict from '$lib/components/history/SemanticVerdict.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.commit.message} — {data.namespace} — Priompt</title>
</svelte:head>

<div class="space-y-4">
  <CommitDetail commit={data.commit} namespace={data.namespace} />

  <!-- The verdict the server already computed on publish. Shown against the
       commit's parent, so a reviewer sees what the change meant, not only what
       it edited. -->
  {#if data.live}
    <SemanticVerdict changes={data.changes ?? []} verdict={data.verdict ?? ''} />
  {/if}
</div>
