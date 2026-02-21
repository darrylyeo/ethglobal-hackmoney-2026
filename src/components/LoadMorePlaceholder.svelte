<script lang="ts">
	// Types/constants


	// Props
	let {
		count,
		onLoadMore,
		label = 'Load more',
	}: {
		count: number
		onLoadMore: () => void
		label?: string
	} = $props()
</script>

{#if count > 0}
	{#each Array(count) as _, i (`placeholder-${i}`)}
		<button
			type="button"
			class="load-more-placeholder"
			onclick={onLoadMore}
			aria-label={label}
		>
			<span class="load-more-placeholder-bar"></span>
			<span class="load-more-placeholder-meta"></span>
		</button>
	{/each}
{/if}

<style>
	.load-more-placeholder {
		display: block;
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid color-mix(in oklab, currentColor 18%, transparent);
		border-radius: 0.5rem;
		background: color-mix(in oklab, currentColor 3%, transparent);
		cursor: pointer;
		text-align: left;
	}

	.load-more-placeholder:hover {
		background: color-mix(in oklab, currentColor 8%, transparent);
		border-color: color-mix(in oklab, currentColor 35%, transparent);
	}

	.load-more-placeholder-bar,
	.load-more-placeholder-meta {
		display: block;
		height: 1rem;
		background: color-mix(in oklab, currentColor 15%, transparent);
		border-radius: 0.25rem;
		animation: load-more-placeholder-pulse 1.5s ease-in-out infinite;
	}

	.load-more-placeholder-bar {
		width: 60%;
		margin-bottom: 0.5rem;
	}

	.load-more-placeholder-meta {
		width: 30%;
	}

	@keyframes load-more-placeholder-pulse {
		0%,
		100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}
</style>
