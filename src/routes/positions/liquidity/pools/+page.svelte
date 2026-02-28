<script lang="ts">
	// Types/constants
	import type { UniswapPool } from '$/data/UniswapPool.ts'
	import { fetchUniswapPoolsFromSubgraphAndUpsert } from '$/collections/UniswapPools.ts'
	import { uniswapPoolsCollection } from '$/collections/UniswapPools.ts'
	import { UNISWAP_V4_SUBGRAPH_ID } from '$/constants/uniswap.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { eq } from '@tanstack/svelte-db'

	// State
	let selectedChainId = $state<number>(1)

	// (Derived)
	const supportedChainIds = $derived(
		Object.keys(UNISWAP_V4_SUBGRAPH_ID)
			.map(Number)
			.filter((id) => !Number.isNaN(id))
	)
	const poolsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: uniswapPoolsCollection })
				.where(({ row }) => eq(row.chainId, selectedChainId))
				.select(({ row }) => ({ row })),
		[() => selectedChainId],
	)
	const pools = $derived(
		(poolsQuery.data ?? [])
			.map(({ row: pool }) => pool as UniswapPool)
			.sort((a, b) => (Number(b.liquidity) - Number(a.liquidity)))
	)

	// Actions
	$effect(() => {
		if (!supportedChainIds.includes(selectedChainId)) return
		void fetchUniswapPoolsFromSubgraphAndUpsert(selectedChainId, 100).catch(
			() => {},
		)
	})

</script>


<svelte:head>
	<title>Pools — Liquidity</title>
</svelte:head>


<main data-column data-sticky-container>
	<h1>Pools</h1>
	<p data-text="muted">Uniswap V4 pools (from subgraph). Set PUBLIC_GRAPH_API_KEY for data.</p>

	{#if supportedChainIds.length > 0}
		<div data-row="gap-2 wrap">
			<label for="chain-select">Chain</label>

			<select
				id="chain-select"
				bind:value={selectedChainId}
				aria-label="Select chain"
			>
				{#each supportedChainIds as cid}
					{@const net = networksByChainId[cid]}

					<option value={cid}>{net?.name ?? cid}</option>
				{/each}
			</select>
		</div>
	{/if}

	{#if pools.length === 0}
		<p>No pools for this chain. Ensure PUBLIC_GRAPH_API_KEY is set and the subgraph is indexed.</p>
		<p><a href="/positions/liquidity">Back to Liquidity</a>.</p>
	{:else}
		<section class="pool-list">
			<ul data-column data-list="unstyled">
				{#each pools as pool (pool.chainId + ':' + pool.id)}
					{@const net = networksByChainId[pool.chainId]}

					{@const pairLabel = pool.token0Symbol && pool.token1Symbol ? `${pool.token0Symbol}–${pool.token1Symbol}` : pool.id.slice(0, 10) + '…'}

					<li
						data-card="padding-2 radius-4"
						data-row="gap-3 align-center wrap"
					>
						<a href="/positions/liquidity/pool/{pool.chainId}/{pool.id}">{pairLabel}</a>
						<span class="pool-chain">{net?.name ?? pool.chainId}</span>
						<span class="pool-liquidity">Liquidity: {pool.liquidity.toString()}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>


<style>
	.pool-list ul {
		margin: 0;
		padding: 0;
	}
	.pool-chain {
		font-weight: 500;
	}
	.pool-liquidity {
		font-size: 0.9em;
	}
</style>
