<script lang="ts">
	// Types/constants
	import type { ChainId, ParsedNetworkParam } from '$/constants/networks.ts'
	import type { Entity } from '$/data/$EntityType.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { rpcUrls } from '$/constants/rpc-endpoints.ts'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Functions
	import { BlockStream } from '@tevm/voltaire/block'
	import { createHttpProvider } from '$/api/voltaire.ts'


	// State
	import {
		blocksCollection,
		blocksViewFrom,
		ensureBlocksForPlaceholders,
	} from '$/collections/Blocks.ts'
	import { networksCollection } from '$/collections/Networks.ts'


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import NetworkContracts from '$/views/network/NetworkContracts.svelte'
	import NetworkView from '$/views/network/Network.svelte'
	import NetworkName from '$/views/NetworkName.svelte'


	// (Derived)
	const name = $derived(page.params.name ?? '')
	const route = $derived(parseNetworkNameParam(name))
	const chainId = $derived(route?.chainId ?? (0 as ChainId))
	const network = $derived(
		route?.network ?? ({ name: '', type: 'Mainnet' } as unknown as ParsedNetworkParam['network']),
	)
	const slug = $derived(route?.slug ?? '')
	const caip2 = $derived(route?.caip2 ?? '')
	const networkQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: networksCollection })
				.where(({ row }) => eq(row.$id.chainId, chainId))
				.select(({ row }) => ({ row })),
		[() => chainId],
	)


	// State
	let height = $state(0)
	let visiblePlaceholderBlockIds = $state<number[]>([])


	// (Derived)
	const blocksQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: blocksCollection })
				.where(({ row }) => eq(row.$id.$network.chainId, chainId))
				.select(({ row }) => ({ row })),
		[() => chainId],
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
			id: 'network',
			label: 'Network',
			query: networkQuery as { data: { row: unknown }[] | undefined },
		},
		{
			id: 'blocks',
			label: 'Blocks',
			query: blocksQuery as { data: { row: unknown }[] | undefined },
		},
	])

	$effect(() => {
		const rpcUrl = rpcUrls[chainId]
		if (!rpcUrl) return
		const provider = createHttpProvider(rpcUrl)
		const stream = BlockStream({
			provider: provider as Parameters<typeof BlockStream>[0]['provider'],
		})
		const controller = new AbortController()
		;(async () => {
			try {
				for await (const event of stream.watch({
					signal: controller.signal,
					include: 'header',
					pollingInterval: 12_000,
				}))
					height = Number(event.metadata.chainHead)
			} catch {
				// aborted or stream error
			}
		})()
		return () => controller.abort()
	})

	$effect(() => {
		if (height <= 0) return
		const lo = Math.max(0, height - 10)
		ensureBlocksForPlaceholders(
			chainId,
			Array.from({ length: height - lo + 1 }, (_, j) => lo + j),
		)
	})

	$effect(() => {
		ensureBlocksForPlaceholders(chainId, visiblePlaceholderBlockIds)
	})
</script>


<svelte:head>
	<title>
		{route ?
			`${network.name} · Network`
		: 'Network'}
	</title>
</svelte:head>


<main data-column="gap-2">
	{#if !route}
		<h1>Network not found</h1>
		<p>The network "{name}" could not be resolved.</p>
	{:else}
		<EntityView
			entityType={EntityType.Network}
			entity={
				networkQuery.data?.[0]?.row && route ?
					({
						...networkQuery.data[0].row,
						network: route.network,
						slug: route.slug,
						caip2: route.caip2,
					} as Entity<EntityType.Network> & {
						network: typeof route.network
						slug: string
						caip2: string
					})
				: undefined
			}
			idSerialized={slug}
			href={resolve(`/network/${name}`)}
			label={network.name}
			metadata={[
				{ term: 'Chain ID', detail: String(chainId) },
				{ term: 'CAIP-2', detail: caip2 },
				...(
					'nativeCurrency' in network && network.nativeCurrency ?
						[{ term: 'Currency', detail: network.nativeCurrency.symbol }]
					: []
				),
			]}
		>
			{#snippet Title()}
				<NetworkName {chainId} />
			{/snippet}
			{#snippet AfterTitle({ entity })}
				{#if entity && 'network' in entity && entity.network?.type}
					<span data-tag={entity.network.type}>{entity.network.type}</span>
				{/if}
			{/snippet}
			{#snippet children()}
				{@const placeholderBlockIds = (() => {
					const h = height > 0 ? height : Number(latestBlockQuery.data?.[0] ?? 0)
					return h > 0 ?
						new Set<number | [number, number]>([[0, h]])
					: new Set<number | [number, number]>([0])
				})()}
				<p>
					<a href={resolve(`/network/${name}/contracts`)} data-link>Contracts</a>
				</p>
				<NetworkContracts chainId={chainId} nameParam={name} />
				<NetworkView
					data={blocksViewFrom(chainId, blocksQuery.data ?? []).networkData}
					{placeholderBlockIds}
					bind:visiblePlaceholderBlockIds
					compact
				/>
			{/snippet}
		</EntityView>
	{/if}
</main>


