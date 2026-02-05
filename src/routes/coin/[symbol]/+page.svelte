<script lang="ts">
	// Types/constants
	import { page } from '$app/state'
	import { env } from '$env/dynamic/public'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { ercTokens } from '$/constants/coins'
	import { getCoinForCoinPage, type CoinPageSymbol } from '$/constants/coins'
	import { fetchTransfersGraph, TIME_PERIODS } from '$/api/transfers-indexer'
	import { liveQueryLocalAttachmentFrom } from '$/svelte/live-query-context.svelte'
	import {
		transferGraphsCollection,
		fetchTransferGraph,
	} from '$/collections/transfer-graphs'
	import { toasts } from '$/lib/toast.svelte'
	import Boundary from '$/components/Boundary.svelte'
	import LiveTransfers from '$/views/LiveTransfers.svelte'

	// Props (from load)
	let { data }: { data: { symbol: CoinPageSymbol } } = $props()

	const symbol = $derived(data.symbol)
	const period = $derived(page.url.searchParams.get('period') ?? '1d')
	const coin = $derived(getCoinForCoinPage(symbol))

	const USDC_CHAINS = ercTokens.map((t) => ({
		chainId: t.chainId,
		contractAddress: t.address,
	}))

	const graphQuery = useLiveQuery((q) =>
		q
			.from({ row: transferGraphsCollection })
			.where(({ row }) =>
				and(eq(row.$id.symbol, symbol), eq(row.period, period)),
			)
			.select(({ row }) => ({ row })),
	)
	const liveQueryEntries = $derived([
		{
			id: `transfers-graph-${symbol}`,
			label: 'Transfer Graphs',
			query: graphQuery,
		},
	])
	const liveQueryAttachment = liveQueryLocalAttachmentFrom(
		() => liveQueryEntries,
	)
	const graphRow = $derived(graphQuery.data?.[0]?.row ?? null)

	$effect(() => {
		fetchTransferGraph(symbol, period).catch(() => {})
	})

	$effect(() => {
		const apiKey = env.PUBLIC_COVALENT_API_KEY ?? ''
		if (apiKey.length === 0 || symbol !== 'USDC') return
		fetchTransfersGraph(period, apiKey, USDC_CHAINS).catch(() => {})
	})

	const graph = $derived(graphRow?.graph ?? { nodes: [], edges: [] })
	const periodValue = $derived(graphRow?.period ?? period)
	const periods = $derived(graphRow?.periods ?? TIME_PERIODS)
	const loading = $derived(graphRow?.isLoading ?? true)
	const errorMessage = $derived(graphRow?.error ?? null)
	const errorShort = $derived(
		errorMessage?.includes('trace-id')
			? 'Temporary internal error. Please retry.'
			: errorMessage,
	)

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
					fetchTransferGraph(symbol, period).catch(() => {})
				},
			},
			dismissible: true,
		})
	})
</script>

<svelte:head>
	<title>{symbol} – Coin</title>
</svelte:head>

<main id="main" data-column data-sticky-container {@attach liveQueryAttachment}>
	<section data-scroll-item>
		{#if loading && !graph.nodes.length}
			<p class="transfers-loading" data-transfers-loading aria-live="polite">
				Loading transfers…
			</p>
		{/if}
		<Boundary>
			<LiveTransfers {coin} {graph} period={periodValue} {periods} />

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
	.transfers-loading {
		padding: 1rem;
		opacity: 0.8;
	}

	.transfers-error {
		padding: 1rem;
	}
</style>
