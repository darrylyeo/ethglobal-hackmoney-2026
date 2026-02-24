<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'
	import {
		fetchBlock,
		blocksCollection,
		ensureLatestBlockForChain,
	} from '$/collections/Blocks.ts'
	import {
		fetchNetworkTransaction,
		networkTransactionsCollection,
		normalizeTxHash,
	} from '$/collections/NetworkTransactions.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import EvmTransactionId from '$/views/EvmTransactionId.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
	import Network from '$/views/network/Network.svelte'
	import Transaction from '$/views/network/Transaction.svelte'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { page } from '$app/state'
	import { resolve } from '$app/paths'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'

	const TX_HASH = /^0x[a-fA-F0-9]{64}$/


	// (Derived)
	const networkSlug = $derived(page.params.networkSlug ?? '')
	const txHashParam = $derived(page.params.transactionId ?? '')
	const route = $derived(parseNetworkNameParam(networkSlug))
	const txHash = $derived(
		txHashParam && TX_HASH.test(txHashParam)
			? normalizeTxHash(txHashParam as `0x${string}`)
			: null,
	)
	const chainId = $derived(route?.chainId ?? (0 as ChainId))
	const networkId = $derived({ chainId })
	const network = $derived(networksByChainId[chainId] ?? null)
	const networkName = $derived(network?.name ?? route?.network?.name ?? '')
	const valid = $derived(!!route && !!txHash)


	// State
	let blockNum = $state(0)
	let visiblePlaceholderBlockIds = $state<number[]>([])


	// (Derived)
	const txQuery = useLiveQuery(
		(q) =>
			valid ?
				q
					.from({ row: networkTransactionsCollection })
					.where(({ row }) =>
						and(
							eq(row.$id.$network.chainId, chainId),
							eq(row.$id.txHash, txHash ?? ''),
						),
					)
					.select(({ row }) => ({ row }))
			: q
					.from({ row: networkTransactionsCollection })
					.where(({ row }) => eq(row.$id.$network.chainId, -1))
					.select(({ row }) => ({ row })),
		[() => chainId, () => txHash, () => valid],
	)
	const blockQuery = useLiveQuery(
		(q) =>
			valid ?
				q
					.from({ row: blocksCollection })
					.where(({ row }) =>
						and(
							eq(row.$id.$network.chainId, chainId),
							eq(row.$id.blockNumber, blockNum),
						),
					)
					.select(({ row }) => ({ row }))
			: q
					.from({ row: blocksCollection })
					.where(({ row }) => eq(row.$id.$network.chainId, -1))
					.select(({ row }) => ({ row })),
		[() => chainId, () => blockNum, () => valid],
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

	const tx = $derived(txQuery.data?.[0]?.row as ChainTransactionEntry | null)
	const block = $derived(blockQuery.data?.[0]?.row as BlockEntry | null)
	const latestBlockNumber = $derived(
		Number(latestBlockQuery.data?.[0] ?? 0),
	)

	$effect(() => {
		if (valid && txHash)
			fetchNetworkTransaction(chainId, txHash).catch(() => {})
	})
	$effect(() => {
		if (tx?.blockNumber != null) blockNum = tx.blockNumber
	})
	$effect(() => {
		if (valid && blockNum > 0) fetchBlock(chainId, blockNum).catch(() => {})
	})
	$effect(() => {
		if (getEffectiveRpcUrl(chainId))
			ensureLatestBlockForChain(chainId).catch(() => {})
	})
</script>


<svelte:head>
	<title>
		{valid && txHash ?
			`Transaction ${txHash.slice(0, 10)}… · ${networkName}`
		: 'Transaction'}
	</title>
</svelte:head>


<main data-column>
	{#if !valid}
		<h1>Not found</h1>
		<p>
			{#if !route}
				Network "{networkSlug}" could not be resolved.
			{:else}
				Invalid transaction hash.
			{/if}
		</p>
	{:else if txHash}
		<EntityView
			entityType={EntityType.Transaction}
			idSerialized={`${chainId}:${txHash}`}
			href={resolve(`/network/${chainId}/transaction/${txHash}`)}
			label={`Tx ${txHash.slice(0, 10)}… · ${networkName}`}
			annotation="Transaction"
		>
			{#snippet Title()}
				<span data-row="inline">
					<EvmTransactionId
						txHash={txHash}
						{chainId}
						isVertical
					/>
					<NetworkName {networkId} showIcon={false} />
				</span>
			{/snippet}
			{#snippet children()}
				{@const bn = blockNum || 0}
				<p>
					<a
						href={resolve(
							blockNum > 0
								? `/network/${chainId}/block/${blockNum}#transaction:${txHash}`
								: `/network/${chainId}`,
						)}
						data-link
					>Show Context</a>
				</p>
				{#if tx}
					<Transaction
						data={new Map([[tx, { events: tx.logs ?? [], trace: undefined }]])}
						{networkId}
						layout={EntityLayout.ContentOnly}
					/>
				{/if}
				<Network
					{networkId}
					placeholderBlockIds={new Set([
						...(bn > 0 ? [bn - 1] : []),
						...(latestBlockNumber <= 0 || bn + 1 <= latestBlockNumber ? [bn + 1] : []),
					])}
					currentBlockNumber={latestBlockNumber || bn}
					bind:visiblePlaceholderBlockIds
				/>
			{/snippet}
		</EntityView>
	{/if}
</main>
