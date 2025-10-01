<script lang="ts">
	let { data } = $props();
	type UpdateDoc = { id: string; title: string; slug?: string; createdAt?: string };
	const recent: UpdateDoc[] = data.recent ?? [];
	const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : '');
</script>

<h2>Recent Updates</h2>

<div class="cards">
	{#each recent as item}
		<a class="card" href={`/${item.slug ?? item.id}`}>
			<h3>{item.title}</h3>
			{#if item.createdAt}
				<small>{formatDate(item.createdAt)}</small>
			{/if}
		</a>
	{/each}
</div>

<style>
	h2 {
		margin: 0.5rem 0;
	}
	h3 {
		margin: 0;
	}
	small {
		color: color-mix(in oklch, var(--contrastColor), transparent 40%);
	}
</style>
