<script lang="ts">
	// Types/constants
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import type { Network } from '$/constants/networks.ts'
	import Collapsible from '$/components/Collapsible.svelte'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import {
		BEACON_EPOCH_EXPLORER_BY_CHAIN_ID,
		BELLATRIX_EPOCH_BY_CHAIN_ID,
		CONSENSUS_SCHEDULE_CHAIN_IDS,
		getCurrentEpoch,
		MERGE_BLOCK_BY_CHAIN_ID,
	} from '$/constants/fork-schedules.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { getNetworkPath } from '$/lib/network-paths.ts'


	// Context
	import { resolve } from '$app/paths'


	// Props
	let {
		data,
		networkId: networkIdProp,
		chainId: chainIdProp,
		placeholderBlockIds,
		visiblePlaceholderBlockIds = $bindable([] as number[]),
		currentBlockNumber,
		isCompact = false,
		forksHref,
	}: {
		data: Map<
			Network | undefined,
			Map<BlockEntry | undefined, Set<ChainTransactionEntry>>
		>
		networkId?: import('$/data/Network.ts').Network$Id
		chainId?: number
		placeholderBlockIds?: Set<number | [number, number]>
		visiblePlaceholderBlockIds?: number[]
		currentBlockNumber?: number
		isCompact?: boolean
		forksHref?: string
	} = $props()


	// (Derived)
	const chainId = $derived(networkIdProp?.chainId ?? chainIdProp ?? undefined)
	const network = $derived([...data.keys()][0])
	const blocksMap = $derived([...data.values()][0] ?? new Map())

	const mergeBlock = $derived(
		chainId != null ? MERGE_BLOCK_BY_CHAIN_ID[chainId] : undefined,
	)
	const bellatrixEpoch = $derived(
		chainId != null ? BELLATRIX_EPOCH_BY_CHAIN_ID[chainId] : undefined,
	)
	const hasConsensusSchedule = $derived(
		chainId != null &&
			CONSENSUS_SCHEDULE_CHAIN_IDS.has(chainId) &&
			mergeBlock != null &&
			bellatrixEpoch != null,
	)
	const showConsensus = $derived(
		hasConsensusSchedule &&
			currentBlockNumber != null &&
			mergeBlock != null &&
			currentBlockNumber >= mergeBlock,
	)
	const currentEpoch = $derived(
		chainId != null && currentBlockNumber != null
			? getCurrentEpoch(chainId, currentBlockNumber)
			: null,
	)
	const recentEpochs = $derived.by(() => {
		if (currentEpoch == null || currentEpoch < 0) return []
		const start = Math.max(0, currentEpoch - 9)
		return Array.from(
			{ length: currentEpoch - start + 1 },
			(_, i) => start + i,
		).reverse()
	})
	const beaconExplorerBase = $derived(
		chainId != null ? BEACON_EPOCH_EXPLORER_BY_CHAIN_ID[chainId] : undefined,
	)
	const showForksCol = $derived(!!forksHref || chainId != null)
	const cardDetailsProps = $derived(
		{ 'data-card': '' },
	)
	const networkLayout = $derived(
		isCompact ? EntityLayout.ContentOnly : EntityLayout.PageSection,
	)

	// (Derived)
	const networkMetadata = $derived(
		network && chainId != null
			? [
					{ term: 'Chain ID', detail: String(chainId) },
					{ term: 'CAIP-2', detail: `eip155:${chainId}` },
					{ term: 'Type', detail: network.type },
					...(
						network.nativeCurrency
							? [{ term: 'Currency', detail: network.nativeCurrency.symbol }]
							: []
					),
				]
			: [],
	)
	const networkHref = $derived(
		chainId != null ? resolve(getNetworkPath(chainId)) : '#',
	)


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import NetworkBlocks from '$/views/network/NetworkBlocks.svelte'
	import NetworkEpochs from '$/views/network/NetworkEpochs.svelte'
	import NetworkForks from '$/views/network/NetworkForks.svelte'
</script>


<EntityView
	entityType={EntityType.Network}
	entityId={chainId != null ? { chainId } : undefined}
	idSerialized={network ? `network:${network.chainId}` : 'network:loading'}
	href={networkHref}
	label={network?.name ?? 'Loading network…'}
	layout={networkLayout}
	metadata={networkMetadata}
	annotation="EVM Network"
	detailsProps={isCompact ? cardDetailsProps : { open: true, 'data-card': '' }}
>
	{#snippet AfterTitle()}
		{#if network}
			<span data-tag>{network.type}</span>
		{/if}
	{/snippet}
	{#snippet children()}
		<div data-grid="columns-3 gap-2">
			{#if showForksCol}
				<NetworkForks
					networkId={chainId != null ? { chainId } : undefined}
					forksHref={forksHref}
					detailsProps={cardDetailsProps}
				/>
			{/if}
			{#if chainId != null}
				<NetworkBlocks
					blocksMap={blocksMap}
					networkId={{ chainId }}
					placeholderBlockIds={placeholderBlockIds ?? new Set<number | [number, number]>([0])}
					bind:visiblePlaceholderBlockIds={visiblePlaceholderBlockIds}
					detailsProps={cardDetailsProps}
				/>
			{/if}
			{#if hasConsensusSchedule}
				{#if showConsensus && recentEpochs.length > 0}
					<NetworkEpochs
						epochs={new Set(recentEpochs)}
						currentEpoch={currentEpoch}
						beaconExplorerBase={beaconExplorerBase}
						detailsProps={cardDetailsProps}
					/>
				{:else}
					<Collapsible
						title="Consensus"
						annotation="Loading consensus…"
						detailsProps={{ ...cardDetailsProps, open: true }}
					/>
				{/if}
			{/if}
		</div>
	{/snippet}
</EntityView>
