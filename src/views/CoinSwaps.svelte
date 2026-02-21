<script lang="ts">
	// Types/constants
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import type { TransferEventRow } from '$/collections/TransferEvents.ts'
	import { swapTransferEventsCollection } from '$/collections/SwapTransferEvents.ts'
	import type { CoinInstance } from '$/constants/coin-instances.ts'
	import type { CoinId } from '$/constants/coins.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import EntityList from '$/components/EntityList.svelte'
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
				.from({ row: swapTransferEventsCollection })
				.where(({ row }) =>
					and(eq(row.$id.symbol, coinId), eq(row.$id.period, period)),
				)
				.select(({ row }) => ({ row })),
		[() => coinId, () => period],
	)
	const liveQueryEntries = $derived([
		{
			id: `swap-transfer-events-${coinId}-${period}`,
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
						<TransferEvent {item} {coin} symbol={coinId} />
					{/if}
				</span>
			{/snippet}
		</EntityList>
	{:else}
		<p data-text="muted">No swaps in this period. DEX swap flows appear here when classification is available.</p>
	{/if}
</details>
