<script lang="ts">
	// Types/constants
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import type { TransferEventRow } from '$/collections/TransferEvents.ts'
	import { bridgeTransferEventsCollection } from '$/collections/BridgeTransferEvents.ts'
	import type { CoinInstance } from '$/constants/coin-instances.ts'
	import type { CoinId } from '$/constants/coins.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import Collapsible from '$/components/Collapsible.svelte'
	import List from '$/components/List.svelte'
	import TransferEvent from '$/views/TransferEvent.svelte'


	// Props
	let {
		coinId,
		period,
		coin,
	}: {
		coinId: CoinId
		period: string
		coin: CoinInstance
	} = $props()


	// State
	const query = useLiveQuery(
		(q) =>
			q
				.from({ row: bridgeTransferEventsCollection })
				.where(({ row }) =>
					and(eq(row.$id.symbol, coinId), eq(row.$id.period, period)),
				)
				.select(({ row }) => ({ row })),
		[() => coinId, () => period],
	)
	const liveQueryEntries = $derived([
		{
			id: `bridge-transfer-events-${coinId}-${period}`,
			label: 'Bridge Transfer Events',
			query,
		},
	])
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const eventsSet = $derived(
		new Set(
			(query.data ?? []).map(({ row: event }) => event as TransferEventRow),
		) as Set<TransferEventRow>
	)


	// Functions
	function getEventKey(row: TransferEventRow): string {
		return `${row.transactionHash}:${row.logIndex}`
	}
</script>


<Collapsible
	title="Bridge transfers"
	annotation={eventsSet.size > 0 ? String(eventsSet.size) : '—'}
>
	<List
		items={eventsSet}
		getKey={getEventKey}
		getSortValue={(event) => -event.timestamp}
		placeholderKeys={new Set()}
		visiblePlaceholderKeys={[]}
		scrollPosition="End"
	>
		{#snippet Item({ key, item, isPlaceholder })}
			<span id="bridge-transfer:{key}">
				{#if isPlaceholder}
					<code>Bridge transfer (loading…)</code>
				{:else}
					<TransferEvent {item} {coin} symbol={coinId} />
				{/if}
			</span>
		{/snippet}

		{#snippet Empty()}
			<p data-text="muted">No bridge transfers in this period. CCTP and other bridge flows appear here when detected.</p>
		{/snippet}
	</List>
</Collapsible>
