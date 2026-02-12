<script lang="ts">
	// Types/constants
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { TIME_PERIODS } from '$/api/transfers-indexer.ts'
	import { coinBySymbol, type CoinSymbol } from '$/constants/coins.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import {
		ensureTransferEventsForPlaceholders,
		fetchTransferEvents,
		transferEventsCollection,
		type TransferEventRow as TransferEventRowType,
		type TransferEventsMetaRow,
	} from '$/collections/TransferEvents.ts'
	import { transferGraphsCollection } from '$/collections/TransferGraphs.ts'
	import { toasts } from '$/lib/toast.svelte.ts'
	import Boundary from '$/components/Boundary.svelte'
	import LiveTransfers from '$/views/LiveTransfers.svelte'
	import CoinTransfers from '$/views/CoinTransfers.svelte'
	import CoinBridgeTransfers from '$/views/CoinBridgeTransfers.svelte'
	import CoinSwaps from '$/views/CoinSwaps.svelte'


	// Props
	let { symbol, period }: { symbol: CoinSymbol; period: string } = $props()


	// (Derived)
	const coin = $derived(coinBySymbol[symbol])


	// State
	const eventsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transferEventsCollection })
				.where(({ row }) =>
					and(eq(row.$id.symbol, symbol), eq(row.$id.period, period)),
				)
				.select(({ row }) => ({ row })),
		[() => symbol, () => period],
	)
	const graphQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transferGraphsCollection })
				.where(({ row }) =>
					and(eq(row.$id.symbol, symbol), eq(row.$id.period, period)),
				)
				.select(({ row }) => ({ row })),
		[() => symbol, () => period],
	)
	const liveQueryEntries = $derived([
		{
			id: `transfer-events-${symbol}-${period}`,
			label: 'Transfer Events',
			query: eventsQuery,
		},
		{
			id: `transfer-graph-${symbol}-${period}`,
			label: 'Transfer Graph',
			query: graphQuery,
		},
	])
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const graphRow = $derived(
		(graphQuery.data ?? [])[0] as
			| { row: import('$/collections/TransferGraphs.ts').TransferGraphRow }
			| undefined,
	)
	const allRows = $derived(eventsQuery.data ?? [])
	const eventRows = $derived(
		allRows.filter(
			(r): r is { row: TransferEventRowType } =>
				(r.row as TransferEventRowType).$id.$network.chainId !== -1,
		),
	)
	const metaRow = $derived(
		allRows.find((r) => (r.row as TransferEventsMetaRow).$id?.chainId === -1)
			?.row as TransferEventsMetaRow | undefined,
	)
	const eventsSet = $derived(
		new Set(eventRows.map((r) => r.row)) as Set<TransferEventRowType>,
	)
	const loading = $derived(metaRow?.isLoading ?? true)
	const errorMessage = $derived(metaRow?.error ?? null)
	const errorShort = $derived(
		errorMessage?.includes('trace-id')
			? 'Temporary internal error. Please retry.'
			: errorMessage,
	)

	let visiblePlaceholderKeys = $state<string[]>([])
	let lastToastedError = $state<string | null>(null)

	$effect(() => {
		fetchTransferEvents(symbol, period).catch(() => {})
	})
	$effect(() => {
		ensureTransferEventsForPlaceholders(symbol, period, visiblePlaceholderKeys)
	})
	$effect(() => {
		period
		symbol
		lastToastedError = null
	})
	$effect(() => {
		const err = errorMessage
		if (!err || err === lastToastedError) return
		lastToastedError = err
		toasts.error(errorShort ?? 'Transfers load failed', {
			action: {
				label: 'Retry',
				onClick: () => {
					lastToastedError = null
					fetchTransferEvents(symbol, period, { force: true }).catch(
						() => {},
					)
				},
			},
			dismissible: true,
		})
	})

	function onRetry() {
		lastToastedError = null
		fetchTransferEvents(symbol, period, { force: true }).catch(() => {})
	}
</script>


	<details>
		<summary data-row="wrap gap-2">
			<h3>Activity</h3>
			<nav data-row="start gap-2" aria-label="Time period">
				{#each TIME_PERIODS as p (p.value)}
					<a
						class="period-link"
						href="?period={p.value}"
						data-active={period === p.value ? '' : undefined}
					>
						{p.label}
					</a>
				{/each}
			</nav>
		</summary>

		{#if loading && eventsSet.size === 0}
			<p class="activity-loading" data-activity-loading aria-live="polite">
				Loading transfers…
			</p>
		{/if}
		{#if graphRow?.row && !graphRow.row.isLoading && graphRow.row.error == null}
			<div class="graph-viz" data-transfer-graph>
				<LiveTransfers
					{coin}
					graph={graphRow.row.graph}
					period={graphRow.row.period}
					periods={graphRow.row.periods}
					showHeader={false}
				/>
			</div>
		{:else if graphRow?.row?.error != null}
			<p class="activity-loading" data-graph-error>
				Graph unavailable: {graphRow.row.error}
			</p>
		{/if}
		<Boundary>
			{#if errorMessage && !loading}
				<div class="activity-error" data-activity-error>
					<h2>Transfers unavailable</h2>
					<p>{errorMessage}</p>
					<p>
						RPC or network may be unreachable. Try another time period or retry.
					</p>
					<button type="button" onclick={onRetry}>Retry</button>
				</div>
			{:else}
				<CoinTransfers
					{eventsSet}
					{symbol}
					{coin}
					bind:visiblePlaceholderKeys
				/>
				<CoinBridgeTransfers {symbol} {period} {coin} />
				<CoinSwaps {symbol} {period} {coin} />
			{/if}
			{#snippet Failed(_error, retryFn)}
				<div class="activity-error" data-activity-error>
					<h2>Transfers unavailable</h2>
					<p>{(_error as Error).message}</p>
					<p>
						RPC or network may be unreachable. Try another time period or retry.
					</p>
					<button
						type="button"
						onclick={() => {
							onRetry()
							retryFn()
						}}
					>
						Retry
					</button>
				</div>
			{/snippet}
		</Boundary>
	</details>


<style>
	.period-link {
		padding: 0.25em 0.5em;
		border-radius: 0.25em;
		text-decoration: none;
		background: var(--color-bg-subtle);
		color: var(--color-text);
	}

	.period-link[data-active] {
		background: var(--accent-backgroundColor);
		color: var(--accent-color);
	}

	.activity-loading {
		padding: 1rem;
		opacity: 0.8;
	}

	.activity-error {
		padding: 1rem;
	}

	.graph-viz {
		margin-bottom: 1rem;
	}
</style>
