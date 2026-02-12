<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import type { Entity } from '$/data/$EntityType.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import type { ParsedNetworkParam } from '$/constants/networks.ts'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { rpcUrls } from '$/constants/rpc-endpoints.ts'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Functions
	import { createHttpProvider } from '$/api/voltaire.ts'
	import { BlockStream } from '@tevm/voltaire/block'


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
	const nameParam = $derived(page.params.name ?? '')
	const parsed = $derived(parseNetworkNameParam(nameParam))
	const chainId = $derived(parsed?.chainId ?? (0 as ChainId))
	const config = $derived(parsed?.config ?? ({ name: '', type: 'Mainnet' } as unknown as ParsedNetworkParam['config']))
	const slug = $derived(parsed?.slug ?? '')
	const caip2 = $derived(parsed?.caip2 ?? '')
	const networkQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: networksCollection })
				.where(({ row }) => eq(row.$id.$network.chainId, chainId))
				.select(({ row }) => ({ row })),
		[() => chainId],
	)
	const networkRow = $derived(networkQuery.data?.[0]?.row)
	const networkEntity = $derived(
		networkRow && parsed
			? ({ ...networkRow, config: parsed.config, slug: parsed.slug, caip2: parsed.caip2 } as Entity<EntityType.Network> & {
					config: typeof parsed.config
					slug: string
					caip2: string
				})
			: undefined,
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

	const blocksView = $derived(blocksViewFrom(chainId, blocksQuery.data ?? []))
	const placeholderBlockIds = $derived(
		(() => {
			const h: number =
				height > 0 ? height : Number(latestBlockQuery.data?.[0] ?? 0)
			return h > 0
				? new Set<number | [number, number]>([[0, h]])
				: new Set<number | [number, number]>([0])
		})(),
	)

	$effect(() => {
		const url = rpcUrls[chainId]
		if (!url) return
		const provider = createHttpProvider(url)
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
	<title>{parsed ? `${config.name} · Network` : 'Network'}</title>
</svelte:head>


<main data-column="gap-2">
	{#if !parsed}
		<h1>Network not found</h1>
		<p>The network "{nameParam}" could not be resolved.</p>
	{:else}
		<EntityView
			entityType={EntityType.Network}
			entity={networkEntity}
			idSerialized={slug}
			href={resolve(`/network/${nameParam}`)}
			label={config.name}
			metadata={[
				{ term: 'Chain ID', detail: String(chainId) },
				{ term: 'CAIP-2', detail: caip2 },
				...('nativeCurrency' in config && config.nativeCurrency
					? [{ term: 'Currency', detail: config.nativeCurrency.symbol }]
					: []),
			]}
		>
			{#snippet Title()}
				<NetworkName {chainId} />
			{/snippet}
			{#snippet AfterTitle({ entity })}
				{#if entity && 'config' in entity && entity.config?.type}
					<span data-tag={entity.config.type}>{entity.config.type}</span>
				{/if}
			{/snippet}
			<p>
				<a href={resolve(`/network/${nameParam}/contracts`)} data-link>Contracts</a>
			</p>
			<NetworkContracts chainId={chainId} nameParam={nameParam} />
			<NetworkView
				data={blocksView.networkData}
				{placeholderBlockIds}
				bind:visiblePlaceholderBlockIds
				compact
			/>
		</EntityView>
	{/if}
</main>


