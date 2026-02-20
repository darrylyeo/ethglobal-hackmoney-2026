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
		blockNumberValid ?
			parseInt(blockNumberParam, 10)
		: 0,
	)
	const transactionId = $derived(
		transactionIdParam && TX_HASH.test(transactionIdParam) ?
			(transactionIdParam as `0x${string}`)
		: null,
	)
	const chainId = $derived(parsed?.chainId ?? (0 as ChainId))
	const network = $derived(networksByChainId[chainId] ?? null)
	const networkName = $derived(network?.name ?? parsed?.network?.name ?? '')
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
	const placeholderBlockIds = $derived(
		(() => {
			const ids = new Set<number | [number, number]>()
			if (blockNumber > 0) ids.add(blockNumber - 1)
			if (height <= 0 || blockNumber + 1 <= height) ids.add(blockNumber + 1)
			return ids
		})(),
	)

	$effect(() => {
		if (valid && transactionId)
			Promise.all([
				fetchNetworkTransaction(chainId, transactionId),
				fetchBlock(chainId, blockNumber),
			]).catch(() => {})
	})
	$effect(() => {
		const rpcUrl = rpcUrls[chainId]
		if (!rpcUrl) return
		getCurrentBlockNumber(createHttpProvider(rpcUrl))
			.then((h) => (height = h))
			.catch(() => {})
	})
</script>


<svelte:head>
	<title>
		{valid && transactionId ?
			`Transaction ${transactionId.slice(0, 10)}… · Block ${blockNumberParam} · ${networkName}`
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
	{:else if transactionId}
		<EntityView
			entityType={EntityType.Transaction}
			idSerialized={`${nameParam}:${transactionId}`}
			href={resolve(
				`/network/${nameParam}/block/${blockNumberParam}/transaction/${transactionIdParam}`,
			)}
			label={`Tx ${transactionId.slice(0, 10)}… · ${networkName}`}
			annotation="Transaction"
		>
		{#snippet Title()}
			<span data-row="inline gap-2">
				<EvmTransactionId
					txHash={transactionId}
					{chainId}
					isVertical
				/>
				<NetworkName {chainId} showIcon={false} />
			</span>
		{/snippet}
		<p>
			<a
				href={`/network/${nameParam}/block/${blockNumberParam}#transaction:${transactionId}`}
				data-link
			>Show Context</a>
		</p>
		<NetworkView
			data={
				network ?
					new Map([
						[
							network,
							block ?
								new Map<BlockEntry, Set<ChainTransactionEntry>>([
									[block, tx ? new Set([tx]) : new Set()],
								])
							: new Map(),
						],
					])
				: new Map()
			}
			{placeholderBlockIds}
		/>
	</EntityView>
	{/if}
</main>
