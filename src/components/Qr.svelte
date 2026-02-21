<script lang="ts">
	// Types/constants
	import { renderSVG } from 'uqr'


	// Props
	let {
		value,
		size = 200,
		ecc = 'M',
	}: {
		value: string
		size?: number
		ecc?: 'L' | 'M' | 'Q' | 'H'
	} = $props()
</script>

{#if value}
	<div
		class="qr"
		style="width: {size}px; height: {size}px"
		role="img"
		aria-label="QR code"
	>
		{@html renderSVG(value, { ecc, border: 1 })}
	</div>
{/if}

<style>
	.qr :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
