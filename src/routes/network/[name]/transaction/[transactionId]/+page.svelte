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
	import { page } from '$app/state'
	import { resolve } from '$app/paths'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import EntityView from '$/components/EntityView.svelte'
	import EvmTransactionId from '$/views/EvmTransactionId.svelte'
	import NetworkView from '$/views/network/Network.svelte'
	import NetworkName from '$/views/NetworkName.svelte'

	const TX_HASH = /^0x[a-fA-F0-9]{64}$/

































	// (Derived)
	const nameParam = $derived(page.params.name ?? '')
	const transactionIdParam = $derived(page.params.transactionId ?? '')
	const parsed = $derived(parseNetworkNameParam(nameParam))
	const transactionId = $derived(
		transactionIdParam && TX_HASH.test(transactionIdParam)
			? (transactionIdParam as `0x${string}`)
			: null,
	)
	const chainId = $derived(parsed?.chainId ?? (0 as ChainId))
	const config = $derived(parsed?.config ?? { name: '' })
	const valid = $derived(!!parsed && !!transactionId)


	// State
	let height = $state(0)
	let blockNumber = $state(0)


	// (Derived)
	const txQuery = useLiveQuery(
		(q) =>
			valid
				? q
						.from({ row: networkTransactionsCollection })
						.where(({ row }) =>
							and(
								eq(row.$id.$network.chainId, chainId),
								eq(row.$id.txHash, transactionId!),
							),
						)
						.select(({ row }) => ({ row }))
				: q
						.from({ row: networkTransactionsCollection })
						.where(({ row }) => eq(row.$id.$network.chainId, -1))
						.select(({ row }) => ({ row })),
		[() => chainId, () => transactionId, () => valid],
	)
	const blockQuery = useLiveQuery(
		(q) =>
			valid
				? q
						.from({ row: blocksCollection })
						.where(({ row }) =>
							and(
								eq(row.$id.$network.chainId, chainId),
								eq(row.$id.blockNumber, blockNumber),
							),
						)
						.select(({ row }) => ({ row }))
				: q
						.from({ row: blocksCollection })
						.where(({ row }) => eq(row.$id.$network.chainId, -1))
						.select(({ row }) => ({ row })),
		[() => chainId, () => blockNumber, () => valid],
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
	const network = $derived(networksByChainId[chainId] ?? null)

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
		valid && blockNumber > 0
			? `/network/${nameParam}/block/${blockNumber}#transaction:${transactionId}`
			: `/network/${nameParam}`,
	)

	$effect(() => {
		if (valid) fetchNetworkTransaction(chainId, transactionId!).catch(() => {})
	})
	$effect(() => {
		if (txRow?.blockNumber != null) blockNumber = txRow.blockNumber
	})
	$effect(() => {
		if (valid && blockNumber > 0) fetchBlock(chainId, blockNumber).catch(() => {})
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
		{valid
			? `Transaction ${transactionId!.slice(0, 10)}… · ${config.name}`
			: 'Transaction'}
	</title>
</svelte:head>


<main data-column="gap-2">
	{#if !valid}
		<h1>Not found</h1>
		<p>
			{#if !parsed}
				Network "{nameParam}" could not be resolved.
			{:else}
				Invalid transaction hash.
			{/if}
		</p>
	{:else}
		<EntityView
			entityType={EntityType.Transaction}
			idSerialized={`${nameParam}:${transactionId}`}
			href={resolve(`/network/${nameParam}/transaction/${transactionId}`)}
			label={`Tx ${transactionId.slice(0, 10)}… · ${config.name}`}
			annotation="Transaction"
		>
			{#snippet Title()}
				<span data-row="inline gap-2">
					<EvmTransactionId
						txHash={transactionId}
						chainId={chainId}
						vertical
					/>
					<NetworkName chainId={chainId} showIcon={false} />
				</span>
			{/snippet}
			<p>
				<a href={showContextUrl} data-link>Show Context</a>
			</p>
			<NetworkView
				data={networkData}
				{placeholderBlockIds}
			/>
		</EntityView>
	{/if}
</main>
