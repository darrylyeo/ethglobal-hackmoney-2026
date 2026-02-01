<script lang="ts">
	import type { UniswapPosition } from '$/collections/uniswap-positions'
	import { formatSmallestToDecimal } from '$/lib/format'

	let {
		positions,
		chainId,
	}: {
		positions: UniswapPosition[]
		chainId: number
	} = $props()
</script>

<section data-card data-column="gap-2">
	<h3>Your Positions</h3>
	{#if positions.length === 0}
		<p data-muted>No positions</p>
	{:else}
		<div data-column="gap-1">
			{#each positions as pos (pos.id)}
				<div data-row="gap-2 align-center" data-position-row>
					<span>Pool {pos.poolId.slice(0, 10)}…</span>
					<span data-tabular>Liquidity: {formatSmallestToDecimal(pos.liquidity, 0, 0)}</span>
					<span data-muted>Range: {pos.tickLower} — {pos.tickUpper}</span>
					<button type="button">Collect</button>
					<button type="button">Remove</button>
				</div>
			{/each}
		</div>
	{/if}
</section>
