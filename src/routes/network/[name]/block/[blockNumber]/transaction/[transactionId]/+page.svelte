<script lang="ts">
	// Types/constants
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import type { ChainId } from '$/constants/networks.ts'
	import { page } from '$app/state'
	import { networksByChainId } from '$/constants/networks.ts'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { rpcUrls } from '$/constants/rpc-endpoints.ts'
	import { createHttpProvider, getCurrentBlockNumber } from '$/api/voltaire.ts'
	import { fetchBlock, blocksCollection } from '$/collections/Blocks.ts'
	import { fetchNetworkTransaction, networkTransactionsCollection } from '$/collections/NetworkTransactions.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { resolve } from '$app/paths'
	import { EntityType } from '$/data/$EntityType.ts'
	import EntityView from '$/components/EntityView.svelte'
	import EvmTransactionId from '$/views/EvmTransactionId.svelte'
	import NetworkView from '$/views/network/Network.svelte'
	import NetworkName from '$/views/NetworkName.svelte'

	const DECIMAL_ONLY = /^\d+$/
	const TX_HASH = /^0x[a-fA-F0-9]{64}$/

































	// (Derived)
	const nameParam = $derived(page.params.name ?? '')
	const blockNumberParam = $derived(page.params.blockNumber ?? '')
	const transactionIdParam = $derived(page.params.transactionId ?? '')
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
	const transactionId = $derived(
		transactionIdParam && TX_HASH.test(transactionIdParam)
			? (transactionIdParam as `0x${string}`)
			: null,
	)
	const chainId = $derived(parsed?.chainId ?? (0 as ChainId))
	const config = $derived(parsed?.config ?? { name: '' })
	const valid = $derived(
		!!parsed && blockNumberValid && transactionId !== null,
	)


	// State
	let height = $state(0)


	// (Derived)
	const txQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: networkTransactionsCollection })
				.where(({ row }) =>
					and(
						eq(row.$id.$network.chainId, chainId),
						eq(row.$id.txHash, transactionId ?? ''),
					),
				)
				.select(({ row }) => ({ row })),
		[() => chainId, () => transactionId],
	)
	const blockQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: blocksCollection })
				.where(({ row }) =>
					and(
						eq(row.$id.$network.chainId, chainId),
						eq(row.$id.blockNumber, blockNumber),
					),
				)
				.select(({ row }) => ({ row })),
		[() => chainId, () => blockNumber],
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
			if (blockNumber > 0) adj.add(blockNumber - 1)
			const next = blockNumber + 1
			if (height <= 0 || next <= height) adj.add(next)
			return new Set<number | [number, number]>(adj)
		})(),
	)

	const showContextUrl = $derived(
		transactionId
			? `/network/${nameParam}/block/${blockNumberParam}#transaction:${transactionId}`
			: '',
	)

	$effect(() => {
		if (valid && transactionId)
			Promise.all([
				fetchNetworkTransaction(chainId, transactionId),
				fetchBlock(chainId, blockNumber),
			]).catch(() => {})
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
		{valid && transactionId
			? `Transaction ${transactionId.slice(0, 10)}… · Block ${blockNumberParam} · ${config.name}`
			: 'Transaction'}
	</title>
</svelte:head>


<main data-column="gap-2">
	{#if !valid}
		<h1>Not found</h1>
		<p>
			{#if !parsed}
				Network "{nameParam}" could not be resolved.
			{:else if !blockNumberValid}
				Block number must be a non-negative decimal integer.
			{:else}
				Invalid transaction hash.
			{/if}
		</p>
	{:else}
		<EntityView
		entityType={EntityType.Transaction}
		idSerialized={`${nameParam}:${transactionId}`}
		href={resolve(
			`/network/${nameParam}/block/${blockNumberParam}/transaction/${transactionIdParam}`,
		)}
		label={`Tx ${transactionId!.slice(0, 10)}… · ${config.name}`}
		annotation="Transaction"
	>
		{#snippet Title()}
			<span data-row="inline gap-2">
				<EvmTransactionId
					txHash={transactionId}
					{chainId}
					vertical
				/>
				<NetworkName {chainId} showIcon={false} />
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
