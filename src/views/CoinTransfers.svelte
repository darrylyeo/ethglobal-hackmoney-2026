<script lang="ts">
	// Types/constants
	import type { TransferEventRow } from '$/collections/TransferEvents.ts'
	import type { CoinInstance } from '$/constants/coin-instances.ts'
	import type { CoinId } from '$/constants/coins.ts'
	import Collapsible from '$/components/Collapsible.svelte'
	import List from '$/components/List.svelte'
	import TransferEvent from '$/views/TransferEvent.svelte'


	// Props
	let {
		eventsSet,
		coinId,
		coin,
		visiblePlaceholderKeys = $bindable([] as string[]),
	}: {
		eventsSet: Set<TransferEventRow>
		coinId: CoinId
		coin: CoinInstance
		visiblePlaceholderKeys?: string[]
	} = $props()


	// Functions
	function getEventKey(row: TransferEventRow): string {
		return `${row.transactionHash}:${row.logIndex}`
	}
</script>


<Collapsible title="Transfers" annotation={String(eventsSet.size)}>
	<List
		items={eventsSet}
		getKey={getEventKey}
		getSortValue={(event) => -event.timestamp}
		placeholderKeys={new Set()}
		bind:visiblePlaceholderKeys
		scrollPosition="End"
	>
		{#snippet Item({ key, item, isPlaceholder })}
			<span id="transfer:{key}">
				{#if isPlaceholder}
					<code>Transfer (loading…)</code>
				{:else}
					<TransferEvent {item} {coin} symbol={coinId} />
				{/if}
			</span>
		{/snippet}

		{#snippet Empty()}
			<p data-text="muted">No transfers.</p>
		{/snippet}
	</List>
</Collapsible>
