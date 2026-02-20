<script lang="ts">
	// Types/constants
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import { type ChainId, networksByChainId } from '$/constants/networks.ts'
	import { page } from '$app/state'
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
	const name = $derived(page.params.name ?? '')
	const blockNumParam = $derived(page.params.blockNumber ?? '')
	const txHashParam = $derived(page.params.transactionId ?? '')
	const route = $derived(parseNetworkNameParam(name))
	const blockNumValid = $derived(
		blockNumParam !== '' &&
		DECIMAL_ONLY.test(blockNumParam) &&
		Number.isSafeInteger(parseInt(blockNumParam, 10)) &&
		parseInt(blockNumParam, 10) >= 0,
	)
	const blockNum = $derived(
		blockNumValid ?
			parseInt(blockNumParam, 10)
		: 0,
	)
	const txHash = $derived(
		txHashParam && TX_HASH.test(txHashParam) ?
			(txHashParam as `0x${string}`)
		: null,
	)
	const chainId = $derived(route?.chainId ?? (0 as ChainId))
	const network = $derived(networksByChainId[chainId] ?? null)
	const networkName = $derived(network?.name ?? route?.network?.name ?? '')
	const valid = $derived(
		!!route && blockNumValid && txHash !== null,
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

	$effect(() => {
		if (valid && txHash)
			Promise.all([
				fetchNetworkTransaction(chainId, txHash),
				fetchBlock(chainId, blockNum),
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
		{valid && txHash ?
			`Transaction ${txHash.slice(0, 10)}… · Block ${blockNumParam} · ${networkName}`
		: 'Transaction'}
	</title>
</svelte:head>



<main data-column="gap-2">
	{#if !valid}
		<h1>Not found</h1>
		<p>
			{#if !route}
				Network "{name}" could not be resolved.
			{:else if !blockNumValid}
				Block number must be a non-negative decimal integer.
			{:else}
				Invalid transaction hash.
			{/if}
		</p>
	{:else if txHash}
		<EntityView
			entityType={EntityType.Transaction}
			idSerialized={`${name}:${txHash}`}
			href={resolve(
				`/network/${name}/block/${blockNumParam}/transaction/${txHashParam}`,
			)}
			label={`Tx ${txHash.slice(0, 10)}… · ${networkName}`}
			annotation="Transaction"
		>
		{#snippet Title()}
			<span data-row="inline gap-2">
				<EvmTransactionId
					txHash={txHash}
					{chainId}
					isVertical
				/>
				<NetworkName {chainId} showIcon={false} />
			</span>
		{/snippet}
		{#snippet children()}
			{@const placeholderBlockIds = new Set([
				...(blockNum > 0 ? [blockNum - 1] : []),
				...(height <= 0 || blockNum + 1 <= height ? [blockNum + 1] : []),
			])}
			<p>
				<a
					href={`/network/${name}/block/${blockNumParam}#transaction:${txHash}`}
					data-link
				>Show Context</a>
			</p>
			<NetworkView
				data={network ?
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
				: new Map()}
				{placeholderBlockIds}
			/>
		{/snippet}
	</EntityView>
	{/if}
</main>
