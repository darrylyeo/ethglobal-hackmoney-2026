<script lang="ts">
	// Types/constants
	import type { UniswapPool } from '$/data/UniswapPool.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { formatFeeTierPercent } from '$/constants/uniswap.ts'

	// Props
	let { pool }: { pool: UniswapPool } = $props()

	// (Derived)
	const network = $derived(networksByChainId[pool.$id.chainId])
	const pairLabel = $derived(
		pool.token0Symbol && pool.token1Symbol
			? `${pool.token0Symbol}–${pool.token1Symbol}`
			: `${pool.token0.slice(0, 6)}… / ${pool.token1.slice(0, 6)}…`,
	)
</script>

<section>
	<dl data-definition-list="vertical">
		<div>
			<dt>Network</dt>
			<dd>{network?.name ?? pool.$id.chainId}</dd>
		</div>
		<div>
			<dt>Token pair</dt>
			<dd>{pairLabel}</dd>
		</div>
		<div>
			<dt>Fee tier</dt>
			<dd>{formatFeeTierPercent(pool.fee)}</dd>
		</div>
		<div>
			<dt>Liquidity</dt>
			<dd>{pool.liquidity.toString()}</dd>
		</div>
		<div>
			<dt>Tick</dt>
			<dd>{pool.tick}</dd>
		</div>
		{#if pool.totalValueLockedUSD != null}
			<div>
				<dt>TVL (USD)</dt>
				<dd>{String(pool.totalValueLockedUSD)}</dd>
			</div>
		{/if}
		{#if pool.volumeUSD != null}
			<div>
				<dt>Volume (USD)</dt>
				<dd>{String(pool.volumeUSD)}</dd>
			</div>
		{/if}
		<div>
			<dt>Token0</dt>
			<dd>
				<a href="/network/{pool.$id.chainId}/contract/{pool.token0}">{pool.token0}</a>
				{#if pool.token0Symbol != null}
					({pool.token0Symbol})
				{/if}
			</dd>
		</div>
		<div>
			<dt>Token1</dt>
			<dd>
				<a href="/network/{pool.$id.chainId}/contract/{pool.token1}">{pool.token1}</a>
				{#if pool.token1Symbol != null}
					({pool.token1Symbol})
				{/if}
			</dd>
		</div>
	</dl>
</section>
