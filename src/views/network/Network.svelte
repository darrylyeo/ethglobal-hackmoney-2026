<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import type { Entity } from '$/data/$EntityType.ts'
	import type { Network } from '$/constants/networks.ts'
	import type { Network$Id } from '$/data/Network.ts'
	import Collapsible from '$/components/Collapsible.svelte'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import {
		beaconEpochExplorerByChainId,
		bellatrixEpochByChainId,
		consensusChainIds,
		getCurrentEpoch,
		mergeBlockByChainId,
	} from '$/constants/forks/index.ts'
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
	}: {
		networkId: Network$Id
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
	} = $props()


	// (Derived)
	const chainId = $derived(networkId.chainId)

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
		dataOverride ?? blocksViewFrom(chainId, blocksQuery.data ?? []).networkData,
	)
	const network = $derived([...data.keys()][0])
	const blocksMap = $derived([...data.values()][0] ?? new Map())

	let heliosSyncStatusTick = $state(0)
	let rpcBlockNumber = $state(0)
	const latestBlockNumber = $derived(Number(latestBlockQuery.data?.[0] ?? 0))
	const effectiveBlockNumber = $derived(
		latestBlockNumber || (rpcBlockNumber > 0 ? rpcBlockNumber : 0),
	)
	const currentBlockNumber = $derived(
		currentBlockNumberOverride ?? effectiveBlockNumber,
	)
	const placeholderBlockIds = $derived(
		placeholderBlockIdsOverride ??
			new Set<number | [number, number]>([[0, effectiveBlockNumber || 0]]),
	)
	const forksHref = $derived(
		forksHrefOverride ?? resolve(getNetworkPath(chainId)) + '/forks',
	)
	const chainIdParam = $derived(idSerialized ?? String(chainId))

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
	const helios = $derived(
		heliosSupported
			? {
					supported: true,
					on: heliosBrowserOn,
					statusLabel: heliosStatusLabel,
					onToggle: (enabled: boolean) =>
						setHeliosBrowserEnabled(chainId, enabled),
				}
			: undefined,
	)

	const BLOCK_POLL_MS = 12_000
	$effect(() => {
		if (getEffectiveRpcUrl(chainId) && latestBlockNumber === 0)
			getCurrentBlockNumber(createProviderForChain(chainId))
				.then((n) => (rpcBlockNumber = n))
				.catch(() => {})
		return () => (rpcBlockNumber = 0)
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

	const mergeBlock = $derived(mergeBlockByChainId[chainId])
	const hasConsensusSchedule = $derived(
		consensusChainIds.has(chainId) &&
			mergeBlock != null &&
			bellatrixEpochByChainId[chainId] != null,
	)
	const currentEpoch = $derived(getCurrentEpoch(chainId, currentBlockNumber))
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
	import NetworkContracts from '$/views/network/NetworkContracts.svelte'
	import NetworkEpochs from '$/views/network/NetworkEpochs.svelte'
	import NetworkForks from '$/views/network/NetworkForks.svelte'
</script>


<EntityView
	entityType={EntityType.Network}
	entity={entity}
	entityId={{ chainId }}
	idSerialized={idSerialized ?? (network ? `network:${network.chainId}` : 'network:loading')}
	href={href ?? resolve(getNetworkPath(chainId))}
	label={label ?? (network?.name ?? 'Loading network…')}
	metadata={metadata ?? (network ? [{ term: 'Chain ID', detail: String(chainId) }, { term: 'CAIP-2', detail: `eip155:${chainId}` }, { term: 'Type', detail: network.type }, ...(network.nativeCurrency ? [{ term: 'Currency', detail: network.nativeCurrency.symbol }] : [])] : [])}
	layout={href && label ? EntityLayout.Page : EntityLayout.ContentOnly}
	Title={Title}
	AfterTitle={AfterTitle}
>
	{#if helios?.supported}
		<section>
			<div data-row data-gap="2" data-wrap>
				<label data-row data-gap="1">
					<input
						type="checkbox"
						checked={helios.on}
						onchange={() => helios.onToggle(!helios.on)}
					/>
					<span>Use Helios (browser)</span>
				</label>
				{#if helios.on && helios.statusLabel}
					<span data-text="annotation">{helios.statusLabel}</span>
				{/if}
			</div>
		</section>
	{/if}
	<section>
		<NetworkContracts networkId={{ chainId }} nameParam={chainIdParam} />
	</section>

	<div data-grid="columns-3 gap-2">
		<section>
			<NetworkForks
				networkId={{ chainId }}
				forksHref={forksHref}
				detailsProps={{ 'data-card': '' }}
			/>
		</section>

		<section>
			<NetworkBlocks
				blocksMap={blocksMap}
				networkId={{ chainId }}
				placeholderBlockIds={placeholderBlockIds}
				bind:visiblePlaceholderBlockIds
				detailsProps={{ 'data-card': '' }}
			/>
		</section>

		{#if hasConsensusSchedule && mergeBlock != null && currentBlockNumber >= mergeBlock}
			<section>
				<NetworkEpochs
					epochs={new Set(recentEpochs)}
					currentEpoch={currentEpoch}
					beaconExplorerBase={beaconEpochExplorerByChainId[chainId]}
					detailsProps={{ 'data-card': '' }}
				/>
			</section>
		{/if}
	</div>
</EntityView>
