<script lang="ts">
  import CommitDetail from '$lib/components/history/CommitDetail.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.commit.message} — {data.namespace} — Priompt</title>
</svelte:head>

<CommitDetail commit={data.commit} namespace={data.namespace} />
