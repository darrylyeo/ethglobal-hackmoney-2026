<script lang="ts">
	// Types/constants
	import { ercTokens } from '$/constants/coins'
	import LiveTransfers from './LiveTransfers.svelte'

	// Props (from load)
	let { data } = $props()

	const coin = $derived(ercTokens[0])
</script>

<svelte:head>
	<title>Transfers – USDC Tools</title>
</svelte:head>

<div data-column>
	<svelte:boundary>
		<LiveTransfers
			coin={coin}
			graph={data.graph}
			period={data.period}
			periods={data.periods}
		/>

		{#snippet failed(error)}
			<div data-transfers-error>
				<h2>Transfers unavailable</h2>
				<p>{(error as Error).message}</p>
				<p>Check that <code>COVALENT_API_KEY</code> is set and the indexer is reachable.</p>
			</div>
		{/snippet}
	</svelte:boundary>
</div>

<style>
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
