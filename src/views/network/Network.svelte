<script
	module
	lang="ts"
>
	export enum NetworkLayout {
		Summary = 'Summary',
		Page = 'Page',
	}
</script>


<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import type { Entity } from '$/data/$EntityType.ts'
	import type { Network } from '$/constants/networks.ts'
	import type { Network$Id } from '$/data/Network.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import Collapsible from '$/components/Collapsible.svelte'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { beaconEpochExplorerByChainId } from '$/constants/forks/index.ts'
	import { getConsensusSchedule, getCurrentEpoch } from '$/lib/forks.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { getNetworkPath } from '$/lib/network-paths.ts'
	import {
		blocksCollection,
		blocksViewFrom,
		ensureBlocksForPlaceholders,
		ensureLatestBlockForChain,
	} from '$/collections/Blocks.ts'
	import { HELIOS_CHAINS } from '$/constants/helios-chains.ts'
	import { HeliosBrowserSyncStatus } from '$/lib/helios-rpc.ts'
	import { getCurrentBlockNumber } from '$/api/voltaire.ts'
	import {
		createProviderForChain,
		getEffectiveRpcUrl,
		getHeliosBrowserEnabled,
		getHeliosBrowserSyncStatus,
		setHeliosBrowserEnabled,
		setHeliosBrowserSyncStatusHandler,
	} from '$/lib/helios-rpc.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { resolve } from '$app/paths'


	// Props
	let {
		networkId,
		network: networkOverride,
		entity,
		idSerialized,
		href,
		label,
		metadata,
		Title,
		AfterTitle,
		data: dataOverride,
		placeholderBlockIds: placeholderBlockIdsOverride,
		currentBlockNumber: currentBlockNumberOverride,
		visiblePlaceholderBlockIds = $bindable([] as number[]),
		forksHref: forksHrefOverride,
		layout = NetworkLayout.Page,
	}: {
		networkId: Network$Id
		network?: Network
		entity?: Entity<EntityType.Network>
		idSerialized?: string
		href?: string
		label?: string
		metadata?: Array<{ term: string; detail: string }>
		Title?: Snippet
		AfterTitle?: Snippet<[{ entity: Entity<EntityType.Network> | undefined; entityType: typeof EntityType.Network }]>
		data?: Map<Network | undefined, Map<BlockEntry | undefined, Set<ChainTransactionEntry>>>
		placeholderBlockIds?: Set<number | [number, number]>
		currentBlockNumber?: number
		visiblePlaceholderBlockIds?: number[]
		forksHref?: string
		layout?: NetworkLayout
	} = $props()

	// (Derived)
	const chainId = $derived(
		networkId.chainId
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
			id: 'blocks',
			label: 'Execution',
			query: blocksQuery as { data: { row: unknown }[] | undefined },
		},
	])

	const data = $derived(
		dataOverride ?? blocksViewFrom(chainId, blocksQuery.data ?? []).networkData
	)
	const networkFromData = $derived(
		[...data.keys()][0]
	)
	const network = $derived(
		networkOverride ?? networksByChainId[chainId] ?? networkFromData
	)
	const blocksMap = $derived(
		[...data.values()][0] ?? new Map()
	)

	let heliosSyncStatusTick = $state(
		0
	)
	let rpcBlockNumber = $state(
		0
	)
	let rpcBlockNumberChainId = $state<number | null>(null)
	const latestBlockNumber = $derived(
		Number(latestBlockQuery.data?.[0] ?? 0)
	)
	const effectiveBlockNumber = $derived(
		latestBlockNumber ||
			(rpcBlockNumberChainId != null &&
				rpcBlockNumberChainId === chainId &&
				rpcBlockNumber > 0 ?
				rpcBlockNumber
			: 0)
	)
	const currentBlockNumber = $derived(
		currentBlockNumberOverride ?? effectiveBlockNumber
	)
	const placeholderBlockIds = $derived(
		placeholderBlockIdsOverride ??
			new Set<number | [number, number]>([[0, effectiveBlockNumber || 0]])
	)
	const forksHref = $derived(
		forksHrefOverride ?? resolve(getNetworkPath(chainId)) + '/forks'
	)

	const heliosSupported = $derived(
		chainId in HELIOS_CHAINS
	)
	const heliosBrowserOn = $derived(
		getHeliosBrowserEnabled(chainId)
	)
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
					: ''
	)
	const helios = $derived(
		heliosSupported
			? {
					supported: true,
					on: heliosBrowserOn,
					statusLabel: heliosStatusLabel,
					onToggle: (enabled: boolean) =>
						setHeliosBrowserEnabled(chainId, enabled),
				}
			: undefined
	)

	const BLOCK_POLL_MS = 12_000
	$effect(() => {
		if (chainId !== rpcBlockNumberChainId) {
			rpcBlockNumber = 0
			rpcBlockNumberChainId = chainId
		}
	})
	$effect(() => {
		if (!getEffectiveRpcUrl(chainId) || latestBlockNumber !== 0) return
		const c = chainId
		getCurrentBlockNumber(createProviderForChain(c))
			.then((n) => {
				rpcBlockNumber = n
				rpcBlockNumberChainId = c
			})
			.catch(() => {})
	})
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
					await new Promise<void>((res) => {
						const t = setTimeout(res, BLOCK_POLL_MS)
						controller.signal.addEventListener(
							'abort',
							() => {
								clearTimeout(t)
								res()
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
		setHeliosBrowserSyncStatusHandler((c) => {
			if (c === chainId) heliosSyncStatusTick++
		})
		return () => setHeliosBrowserSyncStatusHandler(null)
	})

	const consensusSchedule = $derived(
		getConsensusSchedule(chainId)
	)
	const showConsensus = $derived(
		consensusSchedule != null
	)
	const isConsensusLoading = $derived(
		showConsensus &&
			latestBlockQuery.data === undefined &&
			(rpcBlockNumberChainId !== chainId || rpcBlockNumber === 0)
	)
	const currentEpoch = $derived(
		getCurrentEpoch(chainId, currentBlockNumber)
	)
	const recentEpochs = $derived.by(() => {
		if (currentEpoch == null || currentEpoch < 0) return []
		const start = Math.max(0, currentEpoch - 9)
		return Array.from(
			{ length: currentEpoch - start + 1 },
			(_, i) => start + i,
		).reverse()
	})


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import NetworkBlocks from '$/views/network/NetworkBlocks.svelte'
	import ContractsList from '$/views/network/ContractsList.svelte'
	import NetworkEpochs from '$/views/network/NetworkEpochs.svelte'
	import NetworkForks from '$/views/network/NetworkForks.svelte'
</script>


{#if layout === NetworkLayout.Summary}
	<EntityView
		entityType={EntityType.Network}
		entity={entity}
		titleHref={href ?? resolve(getNetworkPath(chainId))}
		{...(entity == null ? { entityId: { chainId }, idSerialized: idSerialized ?? (network ? `network:${network.chainId}` : 'network:loading') } : {})}
		label={label ?? (network?.name ?? 'Loading network…')}
		metadata={metadata ?? (network ? [{ term: 'Chain ID', detail: String(chainId) }, { term: 'CAIP-2', detail: `eip155:${chainId}` }, { term: 'Type', detail: network.type }, ...(network.nativeCurrency ? [{ term: 'Currency', detail: network.nativeCurrency.symbol }] : [])] : [])}
		layout={EntityLayout.PageSection}
		Title={Title}
		AfterTitle={AfterTitle}
	/>
{:else}
	<EntityView
		entityType={EntityType.Network}
		entity={entity}
		titleHref={href ?? resolve(getNetworkPath(chainId))}
		{...(entity == null ? { entityId: { chainId }, idSerialized: idSerialized ?? (network ? `network:${network.chainId}` : 'network:loading') } : {})}
		label={label ?? (network?.name ?? 'Loading network…')}
		metadata={metadata ?? (network ? [{ term: 'Chain ID', detail: String(chainId) }, { term: 'CAIP-2', detail: `eip155:${chainId}` }, { term: 'Type', detail: network.type }, ...(network.nativeCurrency ? [{ term: 'Currency', detail: network.nativeCurrency.symbol }] : [])] : [])}
		layout={href && label ? EntityLayout.Page : EntityLayout.ContentOnly}
		Title={Title}
		AfterTitle={AfterTitle}
	>
		{#if helios?.supported}
			<section>
				<div
					data-row
					data-gap="2"
					data-wrap
				>
					<label
						data-row
						data-gap="1"
					>
						<input
							type="checkbox"
							checked={helios.on}
							onchange={() => helios.onToggle(!helios.on)}
						/>
						<span>
							Use Helios (browser)
						</span>
					</label>

					{#if helios.on && helios.statusLabel}
						<span data-text="annotation">{helios.statusLabel}</span>
					{/if}
				</div>
			</section>
		{/if}

		<div
			class="network-layers"
			data-grid="columns-3 gap-2"
		>
			<section>
				<NetworkForks
					{networkId}
					detailsProps={{ 'data-card': '' }}
				/>
			</section>

			<section>
				<NetworkBlocks
					{blocksMap}
					{networkId}
					placeholderBlockIds={placeholderBlockIds}
					bind:visiblePlaceholderBlockIds
					detailsProps={{ 'data-card': '' }}
				/>
			</section>

			{#if showConsensus}
				<section>
					<NetworkEpochs
						epochs={new Set(recentEpochs)}
						currentEpoch={currentEpoch}
						beaconExplorerBase={beaconEpochExplorerByChainId[chainId]}
						isLoading={isConsensusLoading}
						detailsProps={{ 'data-card': '' }}
					/>
				</section>
			{/if}
		</div>

		<section>
			<ContractsList
				{networkId}
				detailsProps={{ 'data-card': '' }}
			/>
		</section>
	</EntityView>
{/if}


<style>
	.network-layers {
		> section {
			> :global(details) {
				&[data-scroll-container] {
					--scrollContainer-sizeBlock: calc(80cqb - 6rem);
					max-height: calc(80cqb - 6rem);
				}
			}
		}
	}
</style>
