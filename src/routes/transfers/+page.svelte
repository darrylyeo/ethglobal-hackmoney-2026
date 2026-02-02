<script lang="ts">
	// Types/constants
	import { page } from '$app/stores'
	import { env } from '$env/dynamic/public'
	import { ercTokens } from '$/constants/coins'
	import { queryClient } from '$/lib/db/query-client'
	import {
		fetchTransfersGraph,
		TIME_PERIODS,
		type TransfersGraphResult,
	} from '$/api/transfers-indexer'
	import Boundary from '$/components/Boundary.svelte'
	import LiveTransfers from './LiveTransfers.svelte'

	// State
	const USDC_CHAINS = ercTokens.map((t) => ({ chainId: t.chainId, contractAddress: t.address }))
	let transfersData = $state<TransfersGraphResult | null>(null)
	let transfersError = $state<Error | null>(null)
	let transfersLoading = $state(true)

	const coin = $derived(ercTokens[0])
	const period = $derived($page.url.searchParams.get('period') ?? '1d')

	// (Derived) client-side query keyed by period
	$effect(() => {
		const p = period
		transfersError = null
		transfersLoading = true
		let cancelled = false
		const apiKey = env.PUBLIC_COVALENT_API_KEY ?? ''
		queryClient
			.fetchQuery({
				queryKey: ['transfers', p],
				queryFn: () => fetchTransfersGraph(p, apiKey, USDC_CHAINS),
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
		<p data-transfers-loading>Loading transfers…</p>
	{:else if failed}
		<div data-transfers-error>
			<h2>Transfers unavailable</h2>
			<p>{transfersError?.message ?? 'Unknown error'}</p>
			<p>Check that <code>PUBLIC_COVALENT_API_KEY</code> is set and the indexer is reachable.</p>
			<button type="button" onclick={retry}>Retry</button>
		</div>
	{:else}
		<Boundary>
			<LiveTransfers
				coin={coin}
				graph={graph}
				period={periodValue}
				periods={periods}
			/>

			{#snippet Failed(error, retryFn)}
				<div data-transfers-error>
					<h2>Transfers unavailable</h2>
					<p>{(error as Error).message}</p>
					<p>Check that <code>PUBLIC_COVALENT_API_KEY</code> is set and the indexer is reachable.</p>
					<button type="button" onclick={retryFn}>Retry</button>
				</div>
			{/snippet}
		</Boundary>
	{/if}
</main>

<style>
	[data-transfers-loading] {
		padding: 1rem;
		opacity: 0.8;
	}

	[data-transfers-error] {
		padding: 1rem;
	}

	[data-transfers-error] code {
		font-family: var(--font-mono);
		background: var(--color-bg-subtle);
		padding: 0.125em 0.25em;
		border-radius: 0.25em;
	}
</style>
