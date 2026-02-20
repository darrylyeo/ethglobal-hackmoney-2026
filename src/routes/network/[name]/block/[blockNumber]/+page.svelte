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
	import BlockNumber from '$/views/BlockNumber.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import NetworkView from '$/views/network/Network.svelte'
	import NetworkName from '$/views/NetworkName.svelte'


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
		blockNumberValid ?
			parseInt(blockNumberParam, 10)
		: 0,
	)
	const chainId = $derived(parsed?.chainId ?? (0 as ChainId))
	const network = $derived(networksByChainId[chainId] ?? null)
	const networkName = $derived(network?.name ?? parsed?.network?.name ?? '')
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
						eq(row.$id.$network.chainId, chainId),
						eq(row.$id.blockNumber, blockNumber),
					),
				)
				.select(({ row }) => ({ row })),
		[() => chainId, () => blockNumber],
	)
	registerLocalLiveQueryStack(() => [
		{
			id: 'block',
			label: 'Block',
			query: blockQuery as { data: { row: unknown }[] | undefined },
		},
	])

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
		if (valid) fetchBlock(chainId, blockNumber).catch(() => {})
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
		{valid ? `Block ${blockNumberParam} · ${networkName}` : 'Block'}
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
		<EntityView
			entityType={EntityType.Block}
			entityId={{
				$network: { chainId },
				blockNumber: Number(blockNumber),
			}}
			idSerialized={`${nameParam}:${blockNumber}`}
			href={resolve(`/network/${nameParam}/block/${blockNumberParam}`)}
			label={`Block ${blockNumber} · ${networkName}`}
		>
			{#snippet Title()}
				<span data-row="inline gap-2">
					<BlockNumber {chainId} blockNumber={blockNumber} />
					<NetworkName {chainId} showIcon={false} />
				</span>
			{/snippet}
			<p>
				<a href={`/network/${nameParam}#block:${blockNumber}`} data-link>Show Context</a>
			</p>
			<NetworkView
				data={
					network ?
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
					: new Map()
				}
				{placeholderBlockIds}
			/>
		</EntityView>
	{/if}
</main>
