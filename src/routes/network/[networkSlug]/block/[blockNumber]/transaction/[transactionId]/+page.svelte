<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
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
	import { networksByChainId } from '$/constants/networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'
import { entityKey } from '$/lib/entity-key.ts'
	import { getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'

	const DECIMAL_ONLY = /^\d+$/
	const TX_HASH = /^0x[a-fA-F0-9]{64}$/


	// Context
	import { resolve } from '$app/paths'
	import { page } from '$app/state'


	// (Derived)
	const networkSlug = $derived(page.params.networkSlug ?? '')
	const blockNumParam = $derived(page.params.blockNumber ?? '')
	const txHashParam = $derived(page.params.transactionId ?? '')
	const route = $derived(parseNetworkNameParam(networkSlug))
	const blockNumParsed = $derived(parseInt(blockNumParam, 10))
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
	const txHash = $derived(
		txHashParam && TX_HASH.test(txHashParam)
			? normalizeTxHash(txHashParam as `0x${string}`)
			: null,
	)
	const chainId = $derived(route?.chainId ?? (0 as ChainId))
	const networkId = $derived({ chainId })
	const network = $derived(networksByChainId[chainId] ?? null)
	const networkName = $derived(network?.name ?? route?.network?.name ?? '')
	const valid = $derived(
		!!route && blockNumValid && txHash !== null,
	)


	// Context
	const txQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: networkTransactionsCollection })
				.where(({ row }) =>
					and(
						eq(row.$id.$network.chainId, chainId),
						eq(row.$id.txHash, txHash ?? ''),
					),
				)
				.select(({ row }) => ({ row })),
		[() => chainId, () => txHash],
	)
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


	// (Derived)
	const block = $derived(blockQuery.data?.[0]?.row as BlockEntry | null)
	const tx = $derived(txQuery.data?.[0]?.row as ChainTransactionEntry | null)
	const txId = $derived(
		tx?.$id ?? { $network: { chainId }, txHash: txHash ?? ('0x' as `0x${string}`) },
	)
	const latestBlockNumber = $derived(
		Number(latestBlockQuery.data?.[0] ?? 0),
	)


	// State
	let visiblePlaceholderBlockIds = $state<number[]>([])


	// Actions
	$effect(() => {
		if (valid && txHash)
			Promise.all([
				fetchNetworkTransaction(chainId, txHash),
				fetchBlock(chainId, blockNum),
			]).catch(() => {})
	})
	$effect(() => {
		if (getEffectiveRpcUrl(chainId))
			ensureLatestBlockForChain(chainId).catch(() => {})
	})


	// Components
	import { EntityLayout } from '$/components/EntityView.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import EvmTransactionId from '$/views/EvmTransactionId.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
		import Network from '$/views/network/Network.svelte'
		import Transaction from '$/views/network/Transaction.svelte'
</script>


<svelte:head>
	<title>
		{valid && txHash
			? `Transaction ${txHash.slice(0, 10)}… · Block ${blockNumParam} · ${networkName}`
			: 'Transaction'}
	</title>
</svelte:head>


<main data-column>
	{#if !valid}
		<h1>Not found</h1>
		<p>
			{#if !route}
				Network "{networkSlug}" could not be resolved.
			{:else if !blockNumValid}
				Block number must be a non-negative decimal integer.
			{:else}
				Invalid transaction hash.
			{/if}
		</p>
	{:else if txHash}
		<EntityView
			entityType={EntityType.Transaction}
			entity={tx ?? undefined}
			titleHref={resolve(
				`/network/${chainId}/block/${blockNumParam}/transaction/${txHashParam}`,
			)}
			label={`Tx ${txHash.slice(0, 10)}… · ${networkName}`}
			annotation="Transaction"
			{...(tx ? {} : { entityId: txId })}
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
			<p>
				<a
					href={resolve(`/network/${chainId}/block/${blockNumParam}#${entityKey({ entityType: EntityType.Transaction, entityId: txId })}`)}
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
