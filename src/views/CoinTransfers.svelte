<script lang="ts">
	// Types/constants
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { getCoinForCoinPage, type CoinPageSymbol } from '$/constants/coins.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import {
		transferEventsCollection,
		ensureTransferEventsForPlaceholders,
		fetchTransferEvents,
		type TransferEventRow as TransferEventRowType,
		type TransferEventsMetaRow,
	} from '$/collections/TransferEvents.ts'
	import { transferGraphsCollection } from '$/collections/TransferGraphs.ts'
	import { toasts } from '$/lib/toast.svelte.ts'
	import { getCoinIconUrl } from '$/lib/coin-icon.ts'
	import Boundary from '$/components/Boundary.svelte'
	import ItemsListView from '$/components/ItemsListView.svelte'
	import LiveTransfers from '$/views/LiveTransfers.svelte'
	import TransferEventRow from '$/views/TransferEventRow.svelte'

	// Props
	let { symbol, period }: { symbol: CoinPageSymbol; period: string } = $props()

	// (Derived)
	const coin = $derived(getCoinForCoinPage(symbol))

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

	// (Derived)
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
				(r.row as TransferEventRowType).$id.chainId !== -1,
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

	// State
	let visiblePlaceholderKeys = $state<string[]>([])
	let lastToastedError = $state<string | null>(null)
	let coinIconSrc = $state<string | undefined>(undefined)

	$effect(() => {
		getCoinIconUrl(symbol).then((url) => { coinIconSrc = url })
	})

	// (Derived) / effects
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

	// Functions
	function getEventKey(row: TransferEventRowType): string {
		return `${row.transactionHash}:${row.logIndex}`
	}
	function formatAmount(amount: string): string {
		const n = Number(amount) / 1e6
		return n.toLocaleString(undefined, {
			minimumFractionDigits: 0,
			maximumFractionDigits: 4,
		})
	}
	function formatTime(ts: number): string {
		return new Date(ts).toLocaleString(undefined, {
			dateStyle: 'short',
			timeStyle: 'short',
		})
	}
</script>

{#if loading && eventsSet.size === 0}
	<p class="transfers-loading" data-transfers-loading aria-live="polite">
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
	<p class="transfers-loading" data-graph-error>
		Graph unavailable: {graphRow.row.error}
	</p>
{/if}
<Boundary>
	{#if errorMessage && !loading}
		<div class="transfers-error" data-transfers-error>
			<h2>Transfers unavailable</h2>
			<p>{errorMessage}</p>
			<p>
				RPC or network may be unreachable. Try another time period or retry.
			</p>
			<button
				type="button"
				onclick={() => {
					lastToastedError = null
					fetchTransferEvents(symbol, period, { force: true }).catch(
						() => {},
					)
				}}
			>
				Retry
			</button>
		</div>
	{:else}
		<ItemsListView
			title="Transfers"
			loaded={eventsSet.size}
			items={eventsSet}
			getKey={getEventKey}
			getSortValue={(row) => -row.timestamp}
			placeholderKeys={new Set()}
			bind:visiblePlaceholderKeys
			scrollPosition="End"
		>
			{#snippet Item({ key, item, isPlaceholder })}
				{#if !isPlaceholder}
					<span id="transfer:{key}">
						<TransferEventRow
							{item}
							{coin}
							{formatAmount}
							{formatTime}
							{coinIconSrc}
						/>
					</span>
				{:else}
					<span id="transfer:{key}" data-placeholder>Loading…</span>
				{/if}
			{/snippet}
		</ItemsListView>
	{/if}

	{#snippet Failed(error, retryFn)}
		<div class="transfers-error" data-transfers-error>
			<h2>Transfers unavailable</h2>
			<p>{(error as Error).message}</p>
			<p>
				RPC or network may be unreachable. Try another time period or retry.
			</p>
			<button
				type="button"
				onclick={() => {
					lastToastedError = null
					fetchTransferEvents(symbol, period, { force: true }).catch(
						() => {},
					)
					retryFn()
				}}
			>
				Retry
			</button>
		</div>
	{/snippet}
</Boundary>

<style>
	.transfers-loading {
		padding: 1rem;
		opacity: 0.8;
	}

	.transfers-error {
		padding: 1rem;
	}

	.graph-viz {
		margin-bottom: 1rem;
	}
</style>
