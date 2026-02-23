<script lang="ts">
	// Types/constants
	import type { ChainId, ParsedNetworkParam } from '$/constants/networks.ts'
	import type { Entity } from '$/data/$EntityType.ts'
	import {
		blocksCollection,
		blocksViewFrom,
		ensureBlocksForPlaceholders,
		ensureLatestBlockForChain,
	} from '$/collections/Blocks.ts'
	import { networksCollection } from '$/collections/Networks.ts'
	import { HELIOS_CHAINS } from '$/constants/helios-chains.ts'
	import { HeliosBrowserSyncStatus } from '$/lib/helios-rpc.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import {
		getEffectiveRpcUrl,
		getHeliosBrowserEnabled,
		getHeliosBrowserSyncStatus,
		setHeliosBrowserEnabled,
		setHeliosBrowserSyncStatusHandler,
	} from '$/lib/helios-rpc.ts'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'


	// (Derived)
	const name = $derived(page.params.name ?? '')
	const route = $derived(parseNetworkNameParam(name))
	const chainId = $derived(route?.chainId ?? (0 as ChainId))
	const network = $derived(
		route?.network ?? ({ name: '', type: 'Mainnet' } as unknown as ParsedNetworkParam['network']),
	)


	// State
	const networkQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: networksCollection })
				.where(({ row }) => eq(row.$id.chainId, chainId))
				.select(({ row }) => ({ row })),
		[() => chainId],
	)
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
			label: 'Execution',
			query: blocksQuery as { data: { row: unknown }[] | undefined },
		},
	])


	// State (heliosSyncStatusTick before derived that reads it)
	let heliosSyncStatusTick = $state(0)
	let visiblePlaceholderBlockIds = $state<number[]>([])
	const latestBlockNumber = $derived(
		Number(latestBlockQuery.data?.[0] ?? 0),
	)


	// (Derived)
	const heliosSupported = $derived(chainId in HELIOS_CHAINS)
	const heliosBrowserOn = $derived(getHeliosBrowserEnabled(chainId))
	const heliosSyncStatus = $derived.by(() => {
		heliosSyncStatusTick
		return getHeliosBrowserSyncStatus(chainId)
	})
	const heliosStatusLabel = $derived(
		heliosSyncStatus === HeliosBrowserSyncStatus.Syncing
			? 'Helios syncing…'
			: heliosSyncStatus === HeliosBrowserSyncStatus.Ready
				? 'Helios ready'
				: heliosSyncStatus === HeliosBrowserSyncStatus.Fallback
					? 'Using fallback RPC'
					: '',
	)


	// Actions
	const BLOCK_POLL_MS = 12_000
	$effect(() => {
		if (!getEffectiveRpcUrl(chainId)) return
		const controller = new AbortController()
		let mounted = true
		const poll = async () => {
			while (mounted && !controller.signal.aborted) {
				try {
					await ensureLatestBlockForChain(chainId)
				} catch {
					// ignore
				}
				try {
					await new Promise<void>((resolve) => {
						const t = setTimeout(resolve, BLOCK_POLL_MS)
						controller.signal.addEventListener(
							'abort',
							() => {
								clearTimeout(t)
								resolve()
							},
							{ once: true },
						)
					})
				} catch {
					break
				}
			}
		}
		poll()
		return () => {
			mounted = false
			controller.abort()
		}
	})
	$effect(() => {
		ensureBlocksForPlaceholders(chainId, visiblePlaceholderBlockIds)
	})
	$effect(() => {
		const c = chainId
		setHeliosBrowserSyncStatusHandler((chainId) => {
			if (chainId === c) heliosSyncStatusTick++
		})
		return () => setHeliosBrowserSyncStatusHandler(null)
	})


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
	import NetworkContracts from '$/views/network/NetworkContracts.svelte'
	import NetworkView from '$/views/network/Network.svelte'
</script>


<svelte:head>
	<title>
		{route
			? `${network.name} · Network`
			: 'Network'}
	</title>
</svelte:head>


<main data-column>
	{#if !route}
		<h1>Network not found</h1>
		<p>The network "{name}" could not be resolved.</p>
	{:else}
		<EntityView
			entityType={EntityType.Network}
			entity={
				networkQuery.data?.[0]?.row && route
					? ({
						...networkQuery.data[0].row,
						network: route.network,
					} as Entity<EntityType.Network> & { network: typeof route.network })
					: undefined
			}
			idSerialized={name}
			href={resolve(`/network/${name}`)}
			label={network.name}
			metadata={[
				{ term: 'Chain ID', detail: String(chainId) },
				{ term: 'CAIP-2', detail: `eip155:${chainId}` },
				...(
					'nativeCurrency' in network && network.nativeCurrency
						? [{ term: 'Currency', detail: network.nativeCurrency.symbol }]
						: []
				),
			]}
		>
			{#snippet Title()}
				<NetworkName networkId={{ chainId }} />
			{/snippet}
			{#snippet AfterTitle({ entity })}
				{#if entity && 'network' in entity && entity.network?.type}
					<span data-tag={entity.network.type}>{entity.network.type}</span>
				{/if}
			{/snippet}
			{#snippet children()}
				{#if heliosSupported}
					<div data-row data-gap="2" data-wrap>
						<label data-row data-gap="1">
							<input
								type="checkbox"
								checked={heliosBrowserOn}
								onchange={() =>
									setHeliosBrowserEnabled(chainId, !heliosBrowserOn)}
							/>
							<span>Use Helios (browser)</span>
						</label>
						{#if heliosBrowserOn && heliosStatusLabel}
							<span data-text="annotation">{heliosStatusLabel}</span>
						{/if}
					</div>
				{/if}
				<section data-column>
					<NetworkContracts networkId={{ chainId }} nameParam={name} />
				</section>
				<NetworkView
					data={blocksViewFrom(chainId, blocksQuery.data ?? []).networkData}
					networkId={{ chainId }}
					placeholderBlockIds={
						new Set<number | [number, number]>([[0, latestBlockNumber]])
					}
					currentBlockNumber={latestBlockNumber}
					bind:visiblePlaceholderBlockIds
					isCompact
					forksHref={resolve(`/network/${name}/forks`)}
				/>
			{/snippet}
		</EntityView>
	{/if}
</main>


