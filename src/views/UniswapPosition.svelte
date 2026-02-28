<script lang="ts">
	// Types/constants
	import type { UniswapPosition } from '$/data/UniswapPosition.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	// Props
	let { position }: { position: UniswapPosition } = $props()

	// (Derived)
	const network = $derived(
		networksByChainId[position.$id.chainId]
	)
	const poolLabel = $derived(
		position.poolId ? `Pool ${position.poolId.slice(0, 10)}…` : 'Pool (unknown)'
	)
</script>


<section>
	<dl data-definition-list="vertical">
		<div>
			<dt>
				Network
			</dt>
			<dd>{network?.name ?? position.$id.chainId}</dd>
		</div>

		{#if position.poolId}
			<div>
				<dt>
					Pool
				</dt>
				<dd>
					<a href="/positions/liquidity/pool/{position.$id.chainId}/{position.poolId}">{poolLabel}</a>
				</dd>
			</div>
		{/if}

		<div>
			<dt>
				Owner
			</dt>
			<dd>
				<a href="/account/{position.owner}">{position.owner.slice(0, 6)}…{position.owner.slice(-4)}</a>
			</dd>
		</div>

		{#if position.tickLower !== 0 || position.tickUpper !== 0}
			<div>
				<dt>
					Tick range
				</dt>
				<dd>{position.tickLower} – {position.tickUpper}</dd>
			</div>
		{/if}

		{#if position.liquidity !== 0n}
			<div>
				<dt>
					Liquidity
				</dt>
				<dd>{position.liquidity.toString()}</dd>
			</div>
		{/if}

		{#if position.token0Owed !== 0n || position.token1Owed !== 0n}
			<div>
				<dt>
					Fees owed
				</dt>
				<dd>
					token0: {position.token0Owed.toString()}, token1: {position.token1Owed.toString()}
				</dd>
			</div>
		{/if}

		{#if position.tokenId != null}
			<div>
				<dt>
					Token ID
				</dt>
				<dd>{position.tokenId.toString()}</dd>
			</div>
		{/if}
	</dl>

	<p>
		<a href="/session?template=AddLiquidity">
			Manage
		</a>
	</p>
</section>
