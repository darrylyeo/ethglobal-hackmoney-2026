<script lang="ts">
	// Types/constants
	import { type ChainId, networksByChainId } from '$/constants/networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
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
	import BlockNumber from '$/views/BlockNumber.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import NetworkView from '$/views/network/Network.svelte'
	import NetworkName from '$/views/NetworkName.svelte'


	// (Derived)
	const name = $derived(page.params.name ?? '')
	const blockNumParam = $derived(page.params.blockNumber ?? '')
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
	const chainId = $derived(route?.chainId ?? (0 as ChainId))
	const network = $derived(networksByChainId[chainId] ?? null)
	const networkName = $derived(network?.name ?? route?.network?.name ?? '')
	const valid = $derived(!!route && blockNumValid)


	// State
	let height = $state(0)


	// (Derived)
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
			id: 'block',
			label: 'Block',
			query: blockQuery as { data: { row: unknown }[] | undefined },
		},
	])

	const block = $derived(blockQuery.data?.[0]?.row as BlockEntry | null)

	$effect(() => {
		if (valid) fetchBlock(chainId, blockNum).catch(() => {})
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
		{valid ?
			`Block ${blockNumParam} · ${networkName}`
		: 'Block'}
	</title>
</svelte:head>


<main data-column="gap-2">
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
			entityId={{
				$network: { chainId },
				blockNumber: blockNum,
			}}
			idSerialized={`${name}:${blockNum}`}
			href={resolve(`/network/${name}/block/${blockNumParam}`)}
			label={`Block ${blockNum} · ${networkName}`}
		>
			{#snippet Title()}
				<span data-row="inline gap-2">
					<BlockNumber {chainId} blockNumber={blockNum} />
					<NetworkName {chainId} showIcon={false} />
				</span>
			{/snippet}
			{#snippet children()}
				{@const placeholderBlockIds = new Set([
					...(blockNum > 0 ? [blockNum - 1] : []),
					...(height <= 0 || blockNum + 1 <= height ? [blockNum + 1] : []),
				])}
				<p>
					<a href={`/network/${name}#block:${blockNum}`} data-link>Show Context</a>
				</p>
				<NetworkView
					data={network ?
						new Map([
							[
								network,
								block ?
									new Map<BlockEntry, Set<ChainTransactionEntry>>([
										[block, new Set()],
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
