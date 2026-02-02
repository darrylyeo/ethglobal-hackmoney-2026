<script lang="ts">
	// Types/constants
	import { page } from '$app/stores'
	import { env } from '$env/dynamic/public'
	import { ercTokens } from '$/constants/coins'
	import { queryClient } from '$/lib/db/query-client'
	import {
		fetchTransfersGraph,
		fetchTransfersGraphFromVoltaire,
		TIME_PERIODS,
		type TransfersGraphResult,
	} from '$/api/transfers-indexer'
	import Boundary from '$/components/Boundary.svelte'
	import LiveTransfers from './LiveTransfers.svelte'

	// State
	const USDC_CHAINS = ercTokens.map((t) => ({
		chainId: t.chainId,
		contractAddress: t.address,
	}))
	let transfersData = $state<TransfersGraphResult | null>(null)
	let transfersError = $state<Error | null>(null)
	let transfersLoading = $state(true)

	const coin = $derived(ercTokens[0])
	const period = $derived($page.url.searchParams.get('period') ?? '1d')

	// (Derived) client-side query keyed by period; primary source: eth_getLogs (Voltaire)
	$effect(() => {
		const p = period
		transfersError = null
		transfersLoading = true
		let cancelled = false
		queryClient
			.fetchQuery({
				queryKey: ['transfers', p],
				queryFn: () => fetchTransfersGraphFromVoltaire(p),
			})
			.then((data) => {
				if (!cancelled) {
					transfersData = data
					transfersLoading = false
				}
			})
			.catch((e) => {
				if (!cancelled) {
					transfersError = e instanceof Error ? e : new Error(String(e))
					transfersLoading = false
				}
			})
		return () => {
			cancelled = true
		}
	})

	// (Derived) optional bridge indexer enrichment (non-blocking)
	$effect(() => {
		const apiKey = env.PUBLIC_COVALENT_API_KEY ?? ''
		if (apiKey.length === 0) return
		const p = period
		fetchTransfersGraph(p, apiKey, USDC_CHAINS).catch(() => {})
	})

	const graph = $derived(transfersData?.graph ?? { nodes: [], edges: [] })
	const periodValue = $derived(transfersData?.period ?? period)
	const periods = $derived(transfersData?.periods ?? TIME_PERIODS)
	const failed = $derived(transfersError != null)

	function retry() {
		transfersError = null
		queryClient.invalidateQueries({ queryKey: ['transfers'] })
	}
</script>

<svelte:head>
	<title>Transfers – USDC Tools</title>
</svelte:head>

<main id="main-content" data-column>
	{#if transfersLoading && !transfersData}
		<p class="transfers-loading">Loading transfers…</p>
	{:else if failed}
		<div class="transfers-error">
			<h2>Transfers unavailable</h2>
			<p>{transfersError?.message ?? 'Unknown error'}</p>
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
