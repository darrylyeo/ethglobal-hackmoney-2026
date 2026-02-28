<script lang="ts">
	// Types/constants
	import type { UniswapPool } from '$/data/UniswapPool.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { fetchPoolFromSubgraph } from '$/api/uniswap-subgraph.ts'
	import { uniswapPoolsCollection } from '$/collections/UniswapPools.ts'
	import { DataSourceId } from '$/constants/data-sources.ts'
	import { normalizeUniswapPool } from '$/collections/UniswapPoolsNormalize.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { and, eq } from '@tanstack/svelte-db'

	// Context
	import { page } from '$app/state'

	// (Derived)
	const chainIdParam = $derived(
		page.params?.chainId ?? ''
	)
	const idParam = $derived(
		page.params?.id ?? ''
	)
	const chainId = $derived(
		parseInt(chainIdParam, 10)
	)
	const valid = $derived(
		chainIdParam !== '' && !Number.isNaN(chainId) && idParam !== ''
	)

	const poolQuery = useLiveQuery(
		(q) =>
			valid
				? q
					.from({ row: uniswapPoolsCollection })
					.where(({ row }) =>
						and(eq(row.$id.chainId, chainId), eq(row.$id.id, idParam)),
					)
					.select(({ row }) => ({ row }))
				: q
					.from({ row: uniswapPoolsCollection })
					.where(({ row }) => eq(row.$id.id, ''))
					.select(({ row }) => ({ row })),
		[() => chainId, () => idParam, () => valid],
	)
	const pool = $derived(
		poolQuery.data?.[0]?.row as UniswapPool | undefined
	)
	const poolId = $derived(
		pool?.$id ?? { chainId, id: idParam }
	)
	const pairLabel = $derived(
		pool?.token0Symbol && pool?.token1Symbol
			? `${pool.token0Symbol}–${pool.token1Symbol}`
			: pool
				? `Pool ${idParam.slice(0, 10)}…`
				: idParam || 'Pool'
	)

	// Actions
	$effect(() => {
		if (!valid || pool != null) return
		void fetchPoolFromSubgraph({ chainId, poolId: idParam }).then(
			(p) => {
				if (p) {
					const pool = { ...normalizeUniswapPool(p), $source: DataSourceId.Uniswap }
					const key = `${pool.$id.chainId}:${pool.$id.id}`
					const existing = uniswapPoolsCollection.state.get(key)
					if (existing) {
						uniswapPoolsCollection.update(key, (draft) => {
							Object.assign(draft, pool)
						})
					} else {
						uniswapPoolsCollection.insert(pool)
					}
				}
			},
		)
	})

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import UniswapPoolView from '$/views/UniswapPool.svelte'
</script>


<svelte:head>
	<title>Pool {idParam.slice(0, 10)}… — Liquidity</title>
</svelte:head>

{#if !valid}
	<main data-card>
		<h1>
			Invalid pool
		</h1>
		<p>
			Chain ID and pool ID are required. <a href="/positions/liquidity/pools">
				Back to Pools
			</a>.
		</p>
	</main>
{:else}
	<main data-card>
		<EntityView
			entityType={EntityType.UniswapPool}
			entity={pool}
			titleHref="/positions/liquidity/pool/{chainId}/{idParam}"
			label={pairLabel}
			{...(pool ? {} : { entityId: poolId })}
			metadata={[
				{ term: 'Chain ID', detail: String(chainId) },
				{ term: 'Pool ID', detail: `${idParam.slice(0, 18)}…` },
			]}
		>
			{#snippet children()}
				{#if pool}
					<UniswapPoolView pool={pool} />
				{:else if poolQuery.isLoading}
					<p>
						Loading pool…
					</p>
				{:else}
					<p>
						Pool not found. It may not be indexed yet.
					</p>
					<p>
						<a href="/positions/liquidity/pools">
							Back to Pools
						</a>.
					</p>
				{/if}
			{/snippet}
		</EntityView>
	</main>
{/if}
