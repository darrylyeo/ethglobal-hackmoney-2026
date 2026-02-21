<script lang="ts">
	// Types/constants
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import type { Network } from '$/constants/networks.ts'
	import {
		BEACON_EPOCH_EXPLORER_BY_CHAIN_ID,
		BELLATRIX_EPOCH_BY_CHAIN_ID,
		CONSENSUS_SCHEDULE_CHAIN_IDS,
		getCurrentEpoch,
		MERGE_BLOCK_BY_CHAIN_ID,
	} from '$/constants/fork-schedules.ts'


	// Props
	let {
		data,
		chainId,
		nameParam,
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
		chainId?: number
		nameParam?: string
		placeholderBlockIds?: Set<number | [number, number]>
		visiblePlaceholderBlockIds?: number[]
		currentBlockNumber?: number
		isCompact?: boolean
		forksHref?: string
	} = $props()


	// (Derived)
	const network = $derived([...data.keys()][0])
	const blocksMap = $derived([...data.values()][0] ?? new Map())
	const placeholderIds = $derived(
		placeholderBlockIds ?? new Set<number | [number, number]>([0]),
	)

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
	const showExecution = $derived(chainId != null)
	const showConsensusCol = $derived(hasConsensusSchedule)
	const showForksCol = $derived(!!forksHref || (chainId != null && nameParam != null))
	const columnCount = $derived(
		[showForksCol, showExecution, showConsensusCol].filter(Boolean).length,
	)
	const gridColumns = $derived(
		columnCount >= 3 ? 'columns-3 gap-2' : columnCount === 2 ? 'columns-2 gap-2' : 'gap-2',
	)
	const cardDetailsProps = $derived(
		isCompact ? { 'data-card': 'radius-2 padding-4' } : { 'data-card': '' },
	)


	// Components
	import NetworkBlocksEntityList from '$/views/network/NetworkBlocksEntityList.svelte'
	import NetworkEpochsEntityList from '$/views/network/NetworkEpochsEntityList.svelte'
	import NetworkForks from '$/views/network/NetworkForks.svelte'
</script>


{#if isCompact}
	<div data-grid={gridColumns}>
		{#if showForksCol}
			<NetworkForks
				chainId={chainId}
				nameParam={nameParam}
				forksHref={forksHref}
				detailsProps={cardDetailsProps}
			/>
		{/if}
		{#if showExecution}
			<NetworkBlocksEntityList
				blocksMap={blocksMap}
				chainId={chainId}
				placeholderBlockIds={placeholderIds}
				bind:visiblePlaceholderBlockIds={visiblePlaceholderBlockIds}
				detailsProps={cardDetailsProps}
			/>
		{/if}
		{#if showConsensusCol}
			{#if showConsensus && recentEpochs.length > 0}
				<NetworkEpochsEntityList
					epochs={new Set(recentEpochs)}
					currentEpoch={currentEpoch}
					beaconExplorerBase={beaconExplorerBase}
					detailsProps={cardDetailsProps}
				/>
			{:else}
				<details open {...cardDetailsProps}>
					<summary>Consensus</summary>
					<p data-text="annotation">
						{currentBlockNumber == null || currentBlockNumber < (mergeBlock ?? 0)
							? 'Loading block height…'
							: 'Loading epochs…'}
					</p>
				</details>
			{/if}
		{/if}
	</div>
{:else}
	<details data-card="radius-2 padding-4" open id={network ? `network:${network.chainId}` : undefined}>
		<summary>
			{#if network}
				<div data-row>
					<div data-row>
						<div data-column>
							<h2>{network.name}</h2>
						</div>

						<span data-tag>{network.type}</span>
					</div>

					<span data-text="annotation">EVM Network</span>
				</div>
			{:else}
				<code>Loading network…</code>
			{/if}
		</summary>

		<div data-column="gap-4">
			{#if network}
				<dl>
					<div>
						<dt>Chain ID</dt>
						<dd><code>{network.chainId}</code></dd>
					</div>
					<div>
						<dt>Chain Agnostic ID</dt>
						<dd><code>eip155:{network.chainId}</code></dd>
					</div>
					<div>
						<dt>Type</dt>
						<dd>{network.type}</dd>
					</div>
					{#if network.nativeCurrency}
						<div>
							<dt>Currency</dt>
							<dd>{network.nativeCurrency.symbol}</dd>
						</div>
					{/if}
				</dl>
			{/if}

			<div data-grid={gridColumns}>
				{#if showForksCol}
					<NetworkForks
						chainId={chainId}
						nameParam={nameParam}
						forksHref={forksHref}
						detailsProps={cardDetailsProps}
					/>
				{/if}
				{#if showExecution}
					<NetworkBlocksEntityList
						blocksMap={blocksMap}
						chainId={chainId}
						placeholderBlockIds={placeholderIds}
						bind:visiblePlaceholderBlockIds={visiblePlaceholderBlockIds}
						detailsProps={cardDetailsProps}
					/>
				{/if}
				{#if showConsensusCol}
					{#if showConsensus && recentEpochs.length > 0}
						<NetworkEpochsEntityList
							epochs={new Set(recentEpochs)}
							currentEpoch={currentEpoch}
							beaconExplorerBase={beaconExplorerBase}
							detailsProps={cardDetailsProps}
						/>
					{:else}
						<details open {...cardDetailsProps}>
							<summary>Consensus</summary>
							<p data-text="annotation">
								{currentBlockNumber == null || currentBlockNumber < (mergeBlock ?? 0)
									? 'Loading block height…'
									: 'Loading epochs…'}
							</p>
						</details>
					{/if}
				{/if}
			</div>
		</div>
	</details>
{/if}
