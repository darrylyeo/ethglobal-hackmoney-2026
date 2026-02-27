<script lang="ts">
	// Types/constants
	import { slotsPerEpoch } from '$/constants/forks/index.ts'


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
	import ItemsListCollapsible from '$/components/ItemsListCollapsible.svelte'
</script>

<ItemsListCollapsible
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
		<p data-text="muted">No epochs.</p>
	{/snippet}
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
					Slots {(item * slotsPerEpoch).toLocaleString()}–{(item * slotsPerEpoch + slotsPerEpoch - 1).toLocaleString()}
				</span>
				{#if key === currentEpoch}
					<span data-text="annotation">(current)</span>
				{/if}
			</span>
		{/if}
	{/snippet}
</ItemsListCollapsible>
