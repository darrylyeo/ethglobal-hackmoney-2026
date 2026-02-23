<script lang="ts">
	// Types/constants
	import { SLOTS_PER_EPOCH } from '$/constants/fork-schedules.ts'


	// Props
	let {
		epochs,
		currentEpoch,
		beaconExplorerBase,
		detailsProps = {},
	}: {
		epochs: Set<number>
		currentEpoch: number | null
		beaconExplorerBase?: string
		detailsProps?: Record<string, unknown>
	} = $props()


	// Components
	import ItemsListView from '$/components/ItemsListView.svelte'
</script>

<ItemsListView
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
	{#snippet Item({ key, item })}
		{#if item != null}
			<span id="epoch:{key}">
				{#if beaconExplorerBase}
					<a
						href={`${beaconExplorerBase}/epoch/${item}`}
						target="_blank"
						rel="noopener noreferrer"
						data-link
					>
						Epoch {item.toLocaleString()}
					</a>
				{:else}
					<code>Epoch {item.toLocaleString()}</code>
				{/if}
				<span data-text="annotation">
					Slots {(item * SLOTS_PER_EPOCH).toLocaleString()}–{(item * SLOTS_PER_EPOCH + SLOTS_PER_EPOCH - 1).toLocaleString()}
				</span>
				{#if key === currentEpoch}
					<span data-text="annotation">(current)</span>
				{/if}
			</span>
		{/if}
	{/snippet}
</ItemsListView>
