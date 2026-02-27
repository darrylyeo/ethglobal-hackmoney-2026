<script lang="ts">
	// Types/constants

	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { DataSourceId } from '$/constants/data-sources.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { networksCollection } from '$/collections/Networks.ts'
	import { coinsCollection } from '$/collections/Coins.ts'


	// State

	const networksQuery = useLiveQuery((q) =>
		q
			.from({ row: networksCollection })
			.orderBy(({ row }) => row.id)
			.select(({ row }) => ({ row })),
	)
	const coinsQuery = useLiveQuery((q) =>
		q
			.from({ row: coinsCollection })
			.orderBy(({ row }) => row.$id.$network.chainId)
			.select(({ row }) => ({ row })),
	)
	const liveQueryEntries = [
		{
			id: 'networks-coins-networks',
			label: 'Networks',
			query: networksQuery,
		},
		{
			id: 'networks-coins-coins',
			label: 'Coins',
			query: coinsQuery,
		},
	]


	// Actions

	registerLocalLiveQueryStack(() => liveQueryEntries)


	// (Derived)

	const networks = $derived(
		(networksQuery.data ?? []).map(({ row: network }) => network),
	)
	const coins = $derived((coinsQuery.data ?? []).map(({ row: coin }) => coin))
</script>


<main
	data-column
	data-sticky-container
>
	<section data-scroll-item>
		<h1>Networks and coins</h1>

		{#if networksQuery.isLoading}
			<p>Loading networks…</p>
		{:else}
			<section>
				<h2>Networks</h2>
				<ul>
					{#each networks as network, i (`${i}-${network.id}`)}
						<li>{network.name} (ID: {network.id})</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if coinsQuery.isLoading}
			<p>Loading coins…</p>
		{:else}
			<section>
				<h2>USDC coins</h2>
				<ul>
					{#each coins as coin, i (`${i}-${coin.$id.$network.chainId}-${coin.$id.address}`)}
						<li>{coin.symbol} on chain {coin.$id.$network.chainId} — {coin.$id.address}</li>
					{/each}
				</ul>
			</section>
		{/if}
	</section>
</main>
