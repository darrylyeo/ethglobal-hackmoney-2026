<script lang="ts">
	// Types/constants
	import { resolve } from '$app/paths'
	import { EntityType } from '$/data/$EntityType.ts'
	import { COIN_PAGE_SYMBOLS, getCoinForCoinPage } from '$/constants/coins.ts'


	// Components
	import EntityId from '$/components/EntityId.svelte'
	import WatchButton from '$/components/WatchButton.svelte'
	import CoinAmount from '$/views/CoinAmount.svelte'
</script>


<svelte:head>
	<title>Coins</title>
</svelte:head>


<main data-column="gap-2">
	<h1>Coins</h1>
	<ul data-column="gap-2">
		{#each COIN_PAGE_SYMBOLS as symbol (symbol)}
			{@const coin = getCoinForCoinPage(symbol)}
			<li data-row="start gap-2 align-center">
				<EntityId
					link={resolve(`/coin/${symbol}`)}
					draggableText={coin.symbol}
					className=""
					entityType={EntityType.Coin}
					entityId={{ network: coin.chainId, address: coin.address }}
				>
					<CoinAmount coin={coin} showIcon symbolOnly />
				</EntityId>
				<WatchButton
					entityType={EntityType.Coin}
					id={symbol}
					label={coin.symbol}
					href={resolve(`/coin/${symbol}`)}
				/>
			</li>
		{/each}
	</ul>
</main>
