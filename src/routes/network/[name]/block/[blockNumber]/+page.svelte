<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { rpcUrls } from '$/constants/rpc-endpoints.ts'
	import { createHttpProvider, getCurrentBlockNumber } from '$/api/voltaire.ts'
	import { fetchBlock, blocksCollection } from '$/collections/Blocks.ts'
	const DECIMAL_ONLY = /^\d+$/


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Components
	import BlockNumber from '$/components/BlockNumber.svelte'
	import NetworkView from '$/components/network/Network.svelte'
	import WatchButton from '$/components/WatchButton.svelte'


	// (Derived)
	const nameParam = $derived(page.params.name ?? '')
	const blockNumberParam = $derived(page.params.blockNumber ?? '')
	const parsed = $derived(parseNetworkNameParam(nameParam))
	const blockNumberValid = $derived(
		blockNumberParam !== '' &&
		DECIMAL_ONLY.test(blockNumberParam) &&
		Number.isSafeInteger(parseInt(blockNumberParam, 10)) &&
		parseInt(blockNumberParam, 10) >= 0,
	)
	const blockNumber = $derived(
		blockNumberValid ? parseInt(blockNumberParam, 10) : 0,
	)
	const chainId = $derived(parsed?.chainId ?? (0 as ChainId))
	const config = $derived(parsed?.config ?? { name: '', explorerUrl: undefined })
	const slug = $derived(parsed?.slug ?? '')
	const caip2 = $derived(parsed?.caip2 ?? '')
	const valid = $derived(!!parsed && blockNumberValid)


	// State
	let height = $state(0)


	// (Derived)
	const blockQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: blocksCollection })
				.where(({ row }) =>
					and(
						eq(row.$id.chainId, chainId),
						eq(row.$id.blockNumber, blockNumber),
					),
				)
				.select(({ row }) => ({ row })),
		[() => chainId, () => blockNumber],
	)
	const liveQueryEntries = $derived([
		{
			id: 'block',
			label: 'Block',
			query: blockQuery as { data: { row: unknown }[] | undefined },
		},
	])
	registerLocalLiveQueryStack(() => liveQueryEntries)

	const blockRow = $derived(blockQuery.data?.[0]?.row as BlockEntry | null)
	const network = $derived(networksByChainId[chainId] ?? null)
	const blocksMap = $derived(
		(() => {
			const inner = new Map<
				BlockEntry | undefined,
				Set<ChainTransactionEntry>
			>()
			if (blockRow) inner.set(blockRow, new Set())
			return inner
		})(),
	)
	const networkData = $derived(
		new Map([[network ?? undefined, blocksMap]]),
	)
	const placeholderBlockIds = $derived(
		(() => {
			const adj = new Set<number>()
			if (blockNumber > 0) adj.add(blockNumber - 1)
			const next = blockNumber + 1
			if (height <= 0 || next <= height) adj.add(next)
			return new Set<number | [number, number]>(adj)
		})(),
	)

	const showContextUrl = $derived(
		`/network/${nameParam}#block:${blockNumber}`,
	)

	$effect(() => {
		if (valid) fetchBlock(chainId, blockNumber).catch(() => {})
	})
	$effect(() => {
		const url = rpcUrls[chainId]
		if (!url) return
		getCurrentBlockNumber(createHttpProvider(url))
			.then((h) => {
				height = h
			})
			.catch(() => {})
	})
</script>


<svelte:head>
	<title>
		{valid ? `Block ${blockNumberParam} · ${config.name}` : 'Block'}
	</title>
</svelte:head>


<main data-column="gap-2">
	{#if !valid}
		<h1>Not found</h1>
		<p>
			{#if !parsed}
				Network "{nameParam}" could not be resolved.
			{:else}
				Block number must be a non-negative decimal integer.
			{/if}
		</p>
	{:else}
		<header data-row="wrap gap-4 align-center">
			<h1>
				<BlockNumber {chainId} blockNumber={blockNumber} />
			</h1>
			<span data-text="annotation">Block</span>
			<WatchButton
				entityType={EntityType.Block}
				id={`${nameParam}:${blockNumber}`}
				label={`Block ${blockNumber} · ${config.name}`}
				href={resolve(`/network/${nameParam}/block/${blockNumberParam}`)}
			/>
		</header>
		<p>
			<a href={showContextUrl} data-link>Show Context</a>
		</p>
		<NetworkView
			data={networkData}
			{placeholderBlockIds}
		/>
	{/if}
</main>
