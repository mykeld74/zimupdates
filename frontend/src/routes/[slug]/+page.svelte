<script lang="ts">
	let { data } = $props();
	type UpdateDoc = { id: string; title: string; html?: string; createdAt?: string };
	const update: UpdateDoc = data.update;
	const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '');
</script>

<article>
	<h1>{update.title}</h1>
	{#if update.createdAt}
		<small>{formatDate(update.createdAt)}</small>
	{/if}
	<div class="content">
		{@html update.html || ''}
	</div>
</article>

<style>
	article {
		max-width: 72ch;
		margin: 2rem auto;
		padding: 0 1rem;
	}
	h1 {
		margin: 0 0 0.25rem 0;
	}
	small {
		color: color-mix(in oklch, var(--contrastColor), transparent 40%);
	}
	.content {
		margin-top: 1rem;
	}
</style>
