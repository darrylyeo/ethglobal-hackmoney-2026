<script lang="ts">
	// Types/constants
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import { type ChainId, networksByChainId } from '$/constants/networks.ts'
	import { getCurrentBlockNumber } from '$/api/voltaire.ts'
	import { createProviderForChain, getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'
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
	const name = $derived(page.params.name ?? '')
	const txHashParam = $derived(page.params.transactionId ?? '')
	const route = $derived(parseNetworkNameParam(name))
	const txHash = $derived(
		txHashParam && TX_HASH.test(txHashParam) ?
			(txHashParam as `0x${string}`)
		: null,
	)
	const chainId = $derived(route?.chainId ?? (0 as ChainId))
	const network = $derived(networksByChainId[chainId] ?? null)
	const networkName = $derived(network?.name ?? route?.network?.name ?? '')
	const valid = $derived(!!route && !!txHash)


	// State
	let height = $state(0)
	let blockNum = $state(0)


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
			fetchNetworkTransaction(chainId, txHash).catch(() => {})
	})
	$effect(() => {
		if (tx?.blockNumber != null) blockNum = tx.blockNumber
	})
	$effect(() => {
		if (valid && blockNum > 0) fetchBlock(chainId, blockNum).catch(() => {})
	})
	$effect(() => {
		const rpcUrl = getEffectiveRpcUrl(chainId)
		if (!rpcUrl) return
		getCurrentBlockNumber(createProviderForChain(chainId))
			.then((h) => (height = h))
			.catch(() => {})
	})
</script>


<svelte:head>
	<title>
		{valid && txHash ?
			`Transaction ${txHash.slice(0, 10)}… · ${networkName}`
		: 'Transaction'}
	</title>
</svelte:head>


<main data-column="gap-2">
	{#if !valid}
		<h1>Not found</h1>
		<p>
			{#if !route}
				Network "{name}" could not be resolved.
			{:else}
				Invalid transaction hash.
			{/if}
		</p>
	{:else if txHash}
		<EntityView
			entityType={EntityType.Transaction}
			idSerialized={`${name}:${txHash}`}
			href={resolve(`/network/${name}/transaction/${txHash}`)}
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
				{@const bn = blockNum || 0}
				{@const placeholderBlockIds = new Set([
					...(bn > 0 ? [bn - 1] : []),
					...(height <= 0 || bn + 1 <= height ? [bn + 1] : []),
				])}
				<p>
					<a
						href={
							blockNum > 0 ?
								`/network/${name}/block/${blockNum}#transaction:${txHash}`
							: `/network/${name}`
						}
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
			{/snippet}
		</EntityView>
	{/if}
</main>
