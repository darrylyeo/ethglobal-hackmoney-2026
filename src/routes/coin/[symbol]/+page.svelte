<script lang="ts">
	// Types/constants
	import { page } from '$app/state'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { getCoinForCoinPage, type CoinPageSymbol } from '$/constants/coins'
	import { TIME_PERIODS } from '$/api/transfers-indexer'
	import { liveQueryLocalAttachmentFrom } from '$/svelte/live-query-context.svelte'
	import {
		transferEventsCollection,
		fetchTransferEvents,
		type TransferEventRow,
		type TransferEventsMetaRow,
	} from '$/collections/transfer-events'
	import { toasts } from '$/lib/toast.svelte'
	import Boundary from '$/components/Boundary.svelte'
	import ItemsList from '$/components/ItemsList.svelte'

	// Props (from load)
	let { data }: { data: { symbol: CoinPageSymbol } } = $props()

	const symbol = $derived(data.symbol)
	const period = $derived(page.url.searchParams.get('period') ?? '1d')
	const coin = $derived(getCoinForCoinPage(symbol))

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
	const liveQueryEntries = $derived([
		{
			id: `transfer-events-${symbol}-${period}`,
			label: 'Transfer Events',
			query: eventsQuery,
		},
	])
	const liveQueryAttachment = liveQueryLocalAttachmentFrom(
		() => liveQueryEntries,
	)
	const allRows = $derived(eventsQuery.data ?? [])
	const eventRows = $derived(
		allRows.filter(
			(r): r is { row: TransferEventRow } =>
				(r.row as TransferEventRow).$id.chainId !== -1,
		),
	)
	const metaRow = $derived(
		allRows.find(
			(r) => (r.row as TransferEventsMetaRow).$id?.chainId === -1,
		)?.row as TransferEventsMetaRow | undefined,
	)
	const eventsSet = $derived(new Set(eventRows.map((r) => r.row)))
	const loading = $derived(metaRow?.isLoading ?? true)
	const errorMessage = $derived(metaRow?.error ?? null)
	const errorShort = $derived(
		errorMessage?.includes('trace-id')
			? 'Temporary internal error. Please retry.'
			: errorMessage,
	)

	let visiblePlaceholderKeys = $state<string[]>([])

	$effect(() => {
		fetchTransferEvents(symbol, period).catch(() => {})
	})

	$effect(() => {
		for (const key of visiblePlaceholderKeys)
			if (!transferEventsCollection.state.get(key))
				fetchTransferEvents(symbol, period).catch(() => {})
	})

	let lastToastedError = $state<string | null>(null)
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
					fetchTransferEvents(symbol, period).catch(() => {})
				},
			},
			dismissible: true,
		})
	})

	function getEventKey(row: TransferEventRow): string {
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

<svelte:head>
	<title>{symbol} – Coin</title>
</svelte:head>

<main id="main" data-column data-sticky-container {@attach liveQueryAttachment}>
	<section data-scroll-item>
		<header class="transfers-header" data-row="wrap gap-2 align-center">
			<h2>Transfers – {coin.symbol}</h2>
			<nav class="period-selector" aria-label="Time period">
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
		</header>
		{#if loading && eventsSet.size === 0}
			<p class="transfers-loading" data-transfers-loading aria-live="polite">
				Loading transfers…
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
							fetchTransferEvents(symbol, period).catch(() => {})
						}}
					>
						Retry
					</button>
				</div>
			{:else}
				<ItemsList
					items={eventsSet}
					getKey={getEventKey}
					getSortValue={(row) => -row.timestamp}
					placeholderKeys={new Set()}
					bind:visiblePlaceholderKeys
					scrollPosition="End"
				>
					{#snippet Item({ key, item, isPlaceholder })}
						{#if isPlaceholder && item}
							<article
								id="transfer:{key}"
								data-card="secondary radius-2 padding-2"
								data-column="gap-1"
							>
								<dl data-row="wrap gap-2">
									<dt>Tx</dt>
									<dd>
										<code>{item.transactionHash.slice(0, 10)}…{item.transactionHash.slice(-8)}</code>
									</dd>
									<dt>From</dt>
									<dd><code>{item.fromAddress.slice(0, 10)}…</code></dd>
									<dt>To</dt>
									<dd><code>{item.toAddress.slice(0, 10)}…</code></dd>
									<dt>Amount</dt>
									<dd>{formatAmount(item.amount)} {coin.symbol}</dd>
									<dt>Time</dt>
									<dd>{formatTime(item.timestamp)}</dd>
								</dl>
							</article>
						{:else}
							<span id="transfer:{key}" data-placeholder>Loading…</span>
						{/if}
					{/snippet}
				</ItemsList>
			{/if}

			{#snippet Failed(error, retryFn)}
				<div class="transfers-error" data-transfers-error>
					<h2>Transfers unavailable</h2>
					<p>{(error as Error).message}</p>
					<p>
						RPC or network may be unreachable. Try another time period or retry.
					</p>
					<button type="button" onclick={retryFn}>Retry</button>
				</div>
			{/snippet}
		</Boundary>
	</section>
</main>

<style>
	.transfers-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}

	.period-selector {
		display: flex;
		gap: 0.5rem;
	}

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

	.transfers-loading {
		padding: 1rem;
		opacity: 0.8;
	}

	.transfers-error {
		padding: 1rem;
	}
</style>
