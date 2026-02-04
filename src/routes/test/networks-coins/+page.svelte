<script lang="ts">
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { DataSource } from '$/constants/data-sources'
	import LiveQueryScope from '$/components/LiveQueryScope.svelte'
	import { networksCollection } from '$/collections/networks'
	import { coinsCollection } from '$/collections/coins'

	const networksQuery = useLiveQuery((q) =>
		q
			.from({ network: networksCollection })
			.where(({ network }) => eq(network.$source, DataSource.Local))
			.orderBy(({ network }) => network.id)
			.select(({ network }) => ({ network })),
	)
	const coinsQuery = useLiveQuery((q) =>
		q
			.from({ coin: coinsCollection })
			.where(({ coin }) => eq(coin.$source, DataSource.Local))
			.orderBy(({ coin }) => coin.chainId)
			.select(({ coin }) => ({ coin })),
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
	const networks = $derived(
		(networksQuery.data ?? []).map((row) => row.network),
	)
	const coins = $derived((coinsQuery.data ?? []).map((row) => row.coin))
</script>

<LiveQueryScope entries={liveQueryEntries}>
<main id="main" data-column data-sticky-container>
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
					{#each coins as coin, i (`${i}-${coin.chainId}-${coin.address}`)}
						<li>{coin.symbol} on chain {coin.chainId} — {coin.address}</li>
					{/each}
				</ul>
			</section>
		{/if}
	</section>
</main>
</LiveQueryScope>
