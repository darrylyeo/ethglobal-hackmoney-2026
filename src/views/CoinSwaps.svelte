<script lang="ts">
	// Types/constants
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import type { TransferEventRow } from '$/collections/TransferEvents.ts'
	import { swapTransferEventsCollection } from '$/collections/SwapTransferEvents.ts'
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
				.from({ row: swapTransferEventsCollection })
				.where(({ row }) =>
					and(eq(row.$id.symbol, symbol), eq(row.$id.period, period)),
				)
				.select(({ row }) => ({ row })),
		[() => symbol, () => period],
	)
	const liveQueryEntries = $derived([
		{
			id: `swap-transfer-events-${symbol}-${period}`,
			label: 'Swap Transfer Events',
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
			<h3>Swaps</h3>
			<span data-text="annotation">
				{eventsSet.size > 0 ? eventsSet.size : '—'}
			</span>
		</summary>
	{#if eventsSet.size > 0}
		<EntityList
			title="Swaps"
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
				<span id="swap:{key}">
					{#if isPlaceholder}
						<code>Swap (loading…)</code>
					{:else}
						<TransferEvent {item} {coin} symbol={symbol} />
					{/if}
				</span>
			{/snippet}
		</EntityList>
	{:else}
		<p data-text="muted">No swaps in this period. DEX swap flows appear here when classification is available.</p>
	{/if}
</details>
