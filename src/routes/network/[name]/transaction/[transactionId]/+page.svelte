<script lang="ts">
	// Types/constants
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import type { ChainId } from '$/constants/networks.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { rpcUrls } from '$/constants/rpc-endpoints.ts'
	import { createHttpProvider, getCurrentBlockNumber } from '$/api/voltaire.ts'
	import { fetchBlock, blocksCollection } from '$/collections/Blocks.ts'
	import { fetchNetworkTransaction, networkTransactionsCollection } from '$/collections/NetworkTransactions.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { resolve } from '$app/paths'
	import { EntityType } from '$/data/$EntityType.ts'
	import EvmTransactionId from '$/components/EvmTransactionId.svelte'
	import NetworkView from '$/components/network/Network.svelte'
	import WatchButton from '$/components/WatchButton.svelte'


	// Context














































	// Props
	let {
		data,
	}: {
		data: {
			nameParam: string
			transactionId: `0x${string}`
			chainId: ChainId
			config: { name: string }
			slug: string
			caip2: string
		},
	} = $props()


	// State
	let height = $state(0)
	let blockNumber = $state(0)


	// (Derived)
	const txQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: networkTransactionsCollection })
				.where(({ row }) =>
					and(
						eq(row.$id.chainId, data.chainId),
						eq(row.$id.txHash, data.transactionId),
					),
				)
				.select(({ row }) => ({ row })),
		[() => data.chainId, () => data.transactionId],
	)
	const blockQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: blocksCollection })
				.where(({ row }) =>
					and(
						eq(row.$id.chainId, data.chainId),
						eq(row.$id.blockNumber, blockNumber),
					),
				)
				.select(({ row }) => ({ row })),
		[() => data.chainId, () => blockNumber],
	)
	const liveQueryEntries = $derived([
		{
			id: 'tx',
			label: 'Transaction',
			query: txQuery as { data: { row: unknown }[] | undefined },
		},
		{
			id: 'block',
			label: 'Block',
			query: blockQuery as { data: { row: unknown }[] | undefined },
		},
	])
	registerLocalLiveQueryStack(() => liveQueryEntries)

	const txRow = $derived(txQuery.data?.[0]?.row as ChainTransactionEntry | null)
	const blockRow = $derived(blockQuery.data?.[0]?.row as BlockEntry | null)
	const network = $derived(networksByChainId[data.chainId] ?? null)

	const blocksMap = $derived(
		(() => {
			const inner = new Map<
				BlockEntry | undefined,
				Set<ChainTransactionEntry>
			>()
			if (blockRow && txRow) inner.set(blockRow, new Set([txRow]))
			else if (blockRow) inner.set(blockRow, new Set())
			return inner
		})(),
	)
	const networkData = $derived(
		new Map([[network ?? undefined, blocksMap]]),
	)
	const placeholderBlockIds = $derived(
		(() => {
			const adj = new Set<number>()
			const bn = blockNumber || 0
			if (bn > 0) adj.add(bn - 1)
			const next = bn + 1
			if (height <= 0 || next <= height) adj.add(next)
			return new Set<number | [number, number]>(adj)
		})(),
	)

	const showContextUrl = $derived(
		blockNumber > 0
			? `/network/${data.nameParam}/block/${blockNumber}#transaction:${data.transactionId}`
			: `/network/${data.nameParam}`,
	)

	$effect(() => {
		fetchNetworkTransaction(data.chainId, data.transactionId).catch(() => {})
	})
	$effect(() => {
		if (txRow?.blockNumber != null) blockNumber = txRow.blockNumber
	})
	$effect(() => {
		if (blockNumber > 0) fetchBlock(data.chainId, blockNumber).catch(() => {})
	})
	$effect(() => {
		const url = rpcUrls[data.chainId]
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
		Transaction {data.transactionId.slice(0, 10)}… · {data.config.name}
	</title>
</svelte:head>


<main data-column="gap-2">
	<header data-row="wrap gap-4">
		<div data-row="start gap-2" data-row-item="flexible">
			<h1 data-orient="vertical">
				<EvmTransactionId
					chainId={data.chainId}
					txHash={data.transactionId}
					vertical
				/>
			</h1>
			<WatchButton
				entityType={EntityType.Transaction}
				id={`${data.nameParam}:${data.transactionId}`}
				label={`Tx ${data.transactionId.slice(0, 10)}… · ${data.config.name}`}
				href={resolve(`/network/${data.nameParam}/transaction/${data.transactionId}`)}
			/>
		</div>
		<div data-row="gap-2">
			<span data-text="annotation">Transaction</span>
		</div>
	</header>
	<p>
		<a href={showContextUrl} data-link>Show Context</a>
	</p>
	<NetworkView
		data={networkData}
		{placeholderBlockIds}
	/>
</main>
