<script lang="ts">
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { networksCollection } from '$/collections/networks'
	import { coinsCollection } from '$/collections/coins'

	const networksQuery = useLiveQuery((q) =>
		q
			.from({ network: networksCollection })
			.orderBy(({ network }) => network.id)
			.select(({ network }) => ({ network })),
	)
	const coinsQuery = useLiveQuery((q) =>
		q
			.from({ coin: coinsCollection })
			.orderBy(({ coin }) => coin.chainId)
			.select(({ coin }) => ({ coin })),
	)
	const networks = $derived(
		(networksQuery.data ?? []).map((row) => row.network ?? row.$selected?.network ?? row),
	)
	const coins = $derived(
		(coinsQuery.data ?? []).map((row) => row.coin ?? row.$selected?.coin ?? row),
	)
</script>

<h1>USDC Bridge</h1>

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
