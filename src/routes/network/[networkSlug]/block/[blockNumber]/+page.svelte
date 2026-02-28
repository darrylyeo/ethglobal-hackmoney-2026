<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import { fetchBlock, blocksCollection, ensureLatestBlockForChain } from '$/collections/Blocks.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'
import { entityKey } from '$/lib/entity-key.ts'
	import { getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'

	const DECIMAL_ONLY = /^\d+$/


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'

	// (Derived)
	const networkSlug = $derived(
		page.params.networkSlug ?? ''
	)
	const blockNumParam = $derived(
		page.params.blockNumber ?? ''
	)
	const route = $derived(
		parseNetworkNameParam(networkSlug)
	)
	const blockNumParsed = $derived(
		parseInt(blockNumParam, 10)
	)
	const blockNumValid = $derived(
		blockNumParam !== ''
		&& DECIMAL_ONLY.test(blockNumParam)
		&& Number.isSafeInteger(blockNumParsed)
		&& blockNumParsed >= 0,
	)
	const blockNum = $derived(
		blockNumValid
			? blockNumParsed
			: 0,
	)
	const chainId = $derived(
		route?.chainId ?? (0 as ChainId)
	)
	const networkId = $derived(
		{ chainId }
	)
	const network = $derived(
		networksByChainId[chainId] ?? null
	)
	const networkName = $derived(
		network?.name ?? route?.network?.name ?? ''
	)
	const valid = $derived(
		!!route && blockNumValid
	)


	// State
	const blockQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: blocksCollection })
				.where(({ row }) =>
					and(
						eq(row.$id.$network.chainId, chainId),
						eq(row.$id.blockNumber, blockNum),
					),
				)
				.select(({ row }) => ({ row })),
		[() => chainId, () => blockNum],
	)
	const latestBlockQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: blocksCollection })
				.where(({ row }) => eq(row.$id.$network.chainId, chainId))
				.orderBy(({ row }) => row.$id.blockNumber, 'desc')
				.select(({ row }) => row.$id.blockNumber),
		[() => chainId],
	)
	registerLocalLiveQueryStack(() => [
		{
			id: 'block',
			label: 'Block',
			query: blockQuery as { data: { row: unknown }[] | undefined },
		},
	])

	const block = $derived(
		blockQuery.data?.[0]?.row as BlockEntry | null
	)
	const blockId = $derived(
		block?.$id ?? { $network: { chainId }, blockNumber: blockNum },
	)
	const latestBlockNumber = $derived(
		Number(latestBlockQuery.data?.[0] ?? 0),
	)

	$effect(() => {
		if (valid) fetchBlock(chainId, blockNum).catch(() => {})
	})
	$effect(() => {
		if (getEffectiveRpcUrl(chainId))
			ensureLatestBlockForChain(chainId).catch(() => {})
	})

	let visiblePlaceholderBlockIds = $state<number[]>([])

	// Components
	import { EntityLayout } from '$/components/EntityView.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import BlockNumber from '$/views/BlockNumber.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
	import Block from '$/views/network/Block.svelte'
	import Network from '$/views/network/Network.svelte'
</script>


<svelte:head>
	<title>
		{valid
			? `Block ${blockNumParam} · ${networkName}`
			: 'Block'}
	</title>
</svelte:head>


<main data-column>
	{#if !valid}
		<h1>Not found</h1>
		<p>
			{#if !route}
				Network "{name}" could not be resolved.
			{:else}
				Block number must be a non-negative decimal integer.
			{/if}
		</p>
	{:else}
		<EntityView
			entityType={EntityType.Block}
			entity={block ?? undefined}
			titleHref={resolve(`/network/${chainId}/block/${blockNumParam}`)}
			label={`Block ${blockNum} · ${networkName}`}
			{...(block ? {} : { entityId: blockId })}
		>
			{#snippet Title()}
				<span data-row="inline">
					<BlockNumber {networkId} blockNumber={blockNum} />
					<NetworkName {networkId} showIcon={false} />
				</span>
			{/snippet}

			{#snippet children()}
				<p>
					<a href={resolve(`/network/${chainId}#${entityKey({ entityType: EntityType.Block, entityId: blockId })}`)} data-link>Show Context</a>
				</p>
				{#if block}
					<Block
						data={new Map([[block, new Set()]])}
						{networkId}
						layout={EntityLayout.ContentOnly}
					/>
				{/if}
				<Network
					{networkId}
					placeholderBlockIds={new Set([
						...(blockNum > 0 ? [blockNum - 1] : []),
						...(latestBlockNumber <= 0 || blockNum + 1 <= latestBlockNumber ? [blockNum + 1] : []),
					])}
					currentBlockNumber={latestBlockNumber || blockNum}
					bind:visiblePlaceholderBlockIds
				/>
			{/snippet}
		</EntityView>
	{/if}
</main>
