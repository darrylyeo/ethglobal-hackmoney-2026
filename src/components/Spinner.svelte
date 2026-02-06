<script lang="ts">


	// Props
	let {
		size = '1em',
	}: {
		size?: string,
	} = $props()
</script>


<span
	class="spinner"
	style:width={size}
	style:height={size}
	aria-hidden="true"
></span>


<style>
	.spinner {
		display: inline-block;
		border: 2px solid var(--color-border);
		border-top-color: var(--color-spinner, currentColor);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
