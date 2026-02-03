<script lang="ts">
	// Types/constants
	import { page } from '$app/stores'
	import { env } from '$env/dynamic/public'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { ercTokens } from '$/constants/coins'
	import {
		fetchTransfersGraph,
		TIME_PERIODS,
	} from '$/api/transfers-indexer'
	import {
		transferGraphsCollection,
		fetchTransferGraph,
	} from '$/collections/transfer-graphs'
	import Boundary from '$/components/Boundary.svelte'
	import LiveTransfers from './LiveTransfers.svelte'

	// State
	const USDC_CHAINS = ercTokens.map((t) => ({
		chainId: t.chainId,
		contractAddress: t.address,
	}))
	const coin = $derived(ercTokens[0])
	const period = $derived($page.url.searchParams.get('period') ?? '1d')

	// Queries (reactive): source-tagged transfer graph from collection
	const graphQuery = useLiveQuery((q) =>
		q
			.from({ row: transferGraphsCollection })
			.where(({ row }) => eq(row.$id.period, period))
			.select(({ row }) => ({ row })),
	)
	const graphRow = $derived(graphQuery.data?.[0]?.row ?? null)

	// (Derived) fetch into collection when period changes
	$effect(() => {
		const p = period
		fetchTransferGraph(p).catch(() => {})
	})

	// (Derived) optional Covalent indexer enrichment (non-blocking)
	$effect(() => {
		const apiKey = env.PUBLIC_COVALENT_API_KEY ?? ''
		if (apiKey.length === 0) return
		const p = period
		fetchTransfersGraph(p, apiKey, USDC_CHAINS).catch(() => {})
	})

	const graph = $derived(graphRow?.graph ?? { nodes: [], edges: [] })
	const periodValue = $derived(graphRow?.period ?? period)
	const periods = $derived(graphRow?.periods ?? TIME_PERIODS)
	const loading = $derived(graphRow?.isLoading ?? true)
	const failed = $derived((graphRow?.error?.length ?? 0) > 0)
	const errorMessage = $derived(graphRow?.error ?? null)

	function retry() {
		if (!period) return
		fetchTransferGraph(period).catch(() => {})
	}
</script>

<svelte:head>
	<title>Transfers – USDC Tools</title>
</svelte:head>

<main id="main-content" data-column>
	{#if loading && !graphRow?.graph?.nodes?.length}
		<p class="transfers-loading" data-transfers-loading>Loading transfers…</p>
	{:else if failed}
		<div class="transfers-error" data-transfers-error>
			<h2>Transfers unavailable</h2>
			<p>{errorMessage ?? 'Unknown error'}</p>
			<p>
				RPC or network may be unreachable. Try another time period or retry.
			</p>
			<button type="button" onclick={retry}>Retry</button>
		</div>
	{:else}
		<Boundary>
			<LiveTransfers {coin} {graph} period={periodValue} {periods} />

			{#snippet Failed(error, retryFn)}
				<div class="transfers-error">
					<h2>Transfers unavailable</h2>
					<p>{(error as Error).message}</p>
					<p>
						RPC or network may be unreachable. Try another time period or retry.
					</p>
					<button type="button" onclick={retryFn}>Retry</button>
				</div>
			{/snippet}
		</Boundary>
	{/if}
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
