<script lang="ts">
	// Props
	let {
		width = '100%',
		height = '1em',
		rounded = '0.25em',
	}: {
		width?: string,
		height?: string,
		rounded?: string,
	} = $props()
</script>


<span
	class="skeleton"
	data-skeleton
	style:width
	style:height
	style:border-radius={rounded}
></span>


<style>
	.skeleton {
		display: inline-block;
		background: linear-gradient(
			90deg,
			var(--color-skeleton) 25%,
			var(--color-skeleton-highlight) 50%,
			var(--color-skeleton) 75%
		);
		background-size: 200% 100%;
		animation: skeleton-shimmer 1.5s ease-in-out infinite;
	}

	@keyframes skeleton-shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
