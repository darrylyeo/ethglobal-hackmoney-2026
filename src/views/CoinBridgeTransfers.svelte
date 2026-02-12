<script lang="ts">
	// Types/constants
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import type { TransferEventRow } from '$/collections/TransferEvents.ts'
	import { bridgeTransferEventsCollection } from '$/collections/BridgeTransferEvents.ts'
	import type { Coin } from '$/constants/coins.ts'
	import type { CoinSymbol } from '$/constants/coins.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import EntityList from '$/components/EntityList.svelte'
	import TransferEvent from '$/views/TransferEvent.svelte'


	// Props
	let {
		symbol,
		period,
		coin,
	}: {
		symbol: CoinSymbol
		period: string
		coin: Coin
	} = $props()


	// State
	const query = useLiveQuery(
		(q) =>
			q
				.from({ row: bridgeTransferEventsCollection })
				.where(({ row }) =>
					and(eq(row.$id.symbol, symbol), eq(row.$id.period, period)),
				)
				.select(({ row }) => ({ row })),
		[() => symbol, () => period],
	)
	const liveQueryEntries = $derived([
		{
			id: `bridge-transfer-events-${symbol}-${period}`,
			label: 'Bridge Transfer Events',
			query,
		},
	])
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const eventsSet = $derived(
		new Set(
			(query.data ?? []).map((r) => r.row as TransferEventRow),
		) as Set<TransferEventRow>,
	)


	// Functions
	function getEventKey(row: TransferEventRow): string {
		return `${row.transactionHash}:${row.logIndex}`
	}
</script>


	<details>
		<summary>
			<h3>Bridge transfers</h3>
			<span data-text="annotation">
				{eventsSet.size > 0 ? eventsSet.size : '—'}
			</span>
		</summary>
		{#if eventsSet.size > 0}
			<EntityList
				title="Bridge transfers"
				detailsProps={{ open: true, 'data-card': '' }}
				loaded={eventsSet.size}
				items={eventsSet}
				getKey={getEventKey}
				getSortValue={(row) => -row.timestamp}
				placeholderKeys={new Set()}
				visiblePlaceholderKeys={[]}
				scrollPosition="End"
			>
				{#snippet Item({ key, item, isPlaceholder })}
					<span id="bridge-transfer:{key}">
						{#if isPlaceholder}
							<code>Bridge transfer (loading…)</code>
						{:else}
							<TransferEvent {item} {coin} symbol={symbol} />
						{/if}
					</span>
				{/snippet}
			</EntityList>
		{:else}
			<p data-text="muted">No bridge transfers in this period. CCTP and other bridge flows appear here when detected.</p>
		{/if}
</details>
