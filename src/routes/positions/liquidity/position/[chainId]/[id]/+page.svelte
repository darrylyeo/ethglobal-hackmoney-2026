<script lang="ts">
	// Types/constants
	import type { UniswapPosition } from '$/data/UniswapPosition.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { uniswapPositionsCollection } from '$/collections/UniswapPositions.ts'
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
		chainIdParam !== '' && !Number.isNaN(chainId) && idParam !== '',
	)

	const positionQuery = useLiveQuery(
		(q) =>
			valid
				? q
					.from({ row: uniswapPositionsCollection })
					.where(({ row }) =>
						and(eq(row.$id.chainId, chainId), eq(row.$id.id, idParam)),
					)
					.select(({ row }) => ({ row }))
				: q
					.from({ row: uniswapPositionsCollection })
					.where(({ row }) => eq(row.$id.id, ''))
					.select(({ row }) => ({ row })),
		[() => chainId, () => idParam, () => valid],
	)
	const position = $derived(
		positionQuery.data?.[0]?.row as UniswapPosition | undefined,
	)
	const positionId = $derived(
		position?.$id ?? { chainId, id: idParam }
	)
	const label = $derived(
		position
			? `Position ${idParam.slice(0, 10)}${idParam.length > 10 ? '…' : ''}`
			: idParam || 'Position',
	)

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import UniswapPosition from '$/views/UniswapPosition.svelte'
</script>


<svelte:head>
	<title>Position {idParam} — Liquidity</title>
</svelte:head>

{#if !valid}
	<main data-card>
		<h1>Invalid position</h1>
		<p>Chain ID and position ID are required. <a href="/positions/liquidity">Back to Liquidity</a>.</p>
	</main>
{:else}
	<main data-card>
		<EntityView
			entityType={EntityType.UniswapPosition}
			entity={position}
			titleHref="/positions/liquidity/position/{chainId}/{idParam}"
			label={label}
			{...(position ? {} : { entityId: positionId })}
			metadata={[
				{ term: 'Chain ID', detail: String(chainId) },
				{ term: 'Position ID', detail: idParam },
			]}
		>
			{#snippet children()}
				{#if position}
					<UniswapPosition position={position} />
				{:else if positionQuery.isLoading}
					<p>Loading position…</p>
				{:else}
					<p>Position not found. It may not be indexed yet.</p>
					<p><a href="/positions/liquidity">Back to Liquidity</a>.</p>
				{/if}
			{/snippet}
		</EntityView>
	</main>
{/if}
