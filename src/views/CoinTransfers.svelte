<script lang="ts">
	// Types/constants
	import type { TransferEventRow } from '$/collections/TransferEvents.ts'
	import type { Coin } from '$/constants/coins.ts'
	import EntityList from '$/components/EntityList.svelte'
	import TransferEvent from '$/views/TransferEvent.svelte'


	// Props
	let {
		eventsSet,
		symbol,
		coin,
		visiblePlaceholderKeys = $bindable([] as string[]),
	}: {
		eventsSet: Set<TransferEventRow>
		symbol: string
		coin: Coin
		visiblePlaceholderKeys?: string[]
	} = $props()


	// Functions
	function getEventKey(row: TransferEventRow): string {
		return `${row.transactionHash}:${row.logIndex}`
	}
</script>


	<details>
		<summary>
			<h3>Transfers</h3>
			<span data-text="annotation">{eventsSet.size}</span>
		</summary>
		<EntityList
			title="Transfers"
			detailsProps={{ open: true, 'data-card': '' }}
			loaded={eventsSet.size}
			items={eventsSet}
			getKey={getEventKey}
			getSortValue={(row) => -row.timestamp}
			placeholderKeys={new Set()}
			bind:visiblePlaceholderKeys
			scrollPosition="End"
		>
			{#snippet Item({ key, item, isPlaceholder })}
				<span id="transfer:{key}">
					{#if isPlaceholder}
						<code>Transfer (loading…)</code>
					{:else}
						<TransferEvent {item} {coin} {symbol} />
					{/if}
				</span>
			{/snippet}
		</EntityList>
	</details>
