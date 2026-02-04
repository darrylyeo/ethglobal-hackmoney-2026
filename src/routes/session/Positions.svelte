<script lang="ts">
	import type { UniswapPosition } from '$/data/UniswapPosition'

	let {
		positions,
		chainId,
	}: { positions: UniswapPosition[]; chainId: number | null } = $props()

	const filtered = $derived(
		chainId !== null ? positions.filter((p) => p.chainId === chainId) : [],
	)
</script>

{#if filtered.length > 0}
	<section data-card data-column="gap-2">
		<h3>Your positions</h3>
		<ul data-column="gap-2" style="list-style: none; padding: 0; margin: 0;">
			{#each filtered as position (position.id)}
				<li data-card="secondary" data-row="gap-2 align-center justify-between">
					<span data-muted>Pool {position.poolId.slice(0, 10)}…</span>
					<span>ticks {position.tickLower} – {position.tickUpper}</span>
					<span>Liquidity: {position.liquidity.toString().slice(0, 12)}…</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}
