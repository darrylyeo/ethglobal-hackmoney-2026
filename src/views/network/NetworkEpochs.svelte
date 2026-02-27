<script lang="ts">
	// Types/constants
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { EntityType } from '$/data/$EntityType.ts'
	import { slotsPerEpoch } from '$/constants/forks/index.ts'


	// Props
	let {
		epochs,
		currentEpoch,
		beaconExplorerBase,
		isLoading = false,
		detailsProps = {},
	}: {
		epochs: Set<number>
		currentEpoch: number | null
		beaconExplorerBase?: string
		isLoading?: boolean
		detailsProps?: Record<string, unknown>
	} = $props()


	// Components
	import CollapsibleList from '$/components/CollapsibleList.svelte'
	import EntityView from '$/components/EntityView.svelte'
</script>

<CollapsibleList
	title="Consensus"
	detailsProps={{ open: true, ...detailsProps }}
	loaded={epochs.size}
	total={currentEpoch != null ? currentEpoch + 1 : undefined}
	items={epochs}
	getKey={(epoch) => epoch}
	getSortValue={(epoch) => -epoch}
	placeholderKeys={new Set()}
	scrollPosition="Start"
>
	{#snippet Empty()}
		<p data-text="muted">
			{isLoading ? 'Loading consensus…' : 'No epochs.'}
		</p>
	{/snippet}
	{#snippet Item({ key, item, isPlaceholder })}
		{#if isPlaceholder}
			<code>Epoch {key} (loading…)</code>
		{:else if item != null}
			{@const epochEntity = { $id: { epoch: item } }}
			{@const slotsDetail = `Slots ${(item * slotsPerEpoch).toLocaleString()}–${(item * slotsPerEpoch + slotsPerEpoch - 1).toLocaleString()}`}
			<span id="epoch:{key}">
				<EntityView
					entityType={EntityType.ConsensusEpoch}
					entity={epochEntity}
					titleHref={beaconExplorerBase ? `${beaconExplorerBase}/epoch/${item}` : false}
					label={`Epoch ${item.toLocaleString()}`}
					layout={EntityLayout.PageSection}
					metadata={[{ term: 'Slots', detail: slotsDetail }]}
					annotation={key === currentEpoch ? 'Epoch (current)' : 'Epoch'}
					showWatchButton={false}
					data-scroll-item="snap-block-start"
				/>
			</span>
		{/if}
	{/snippet}
</CollapsibleList>
