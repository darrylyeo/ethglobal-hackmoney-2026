<script lang="ts">
	// Types/constants
	import { COIN_SYMBOLS, coinBySymbol } from '$/constants/coins.ts'
	import { EntityType } from '$/data/$EntityType.ts'


	// Context
	import { resolve } from '$app/paths'


	// Components
	import EntityId from '$/components/EntityId.svelte'
	import WatchButton from '$/components/WatchButton.svelte'
	import CoinName from '$/views/CoinName.svelte'
</script>


<svelte:head>
	<title>Coins</title>
</svelte:head>


<main data-column="gap-2">
	<h1>Coins</h1>
	<ul data-column="gap-2">
		{#each COIN_SYMBOLS as symbol (symbol)}
			{@const coin = coinBySymbol[symbol]}
			<li data-row="start gap-2 align-center">
				<EntityId
					link={resolve(`/coin/${symbol}`)}
					draggableText={coin.symbol}
					className=""
					entityType={EntityType.Coin}
					entityId={{ network: coin.chainId, address: coin.address }}
				>
					<CoinName coin={coin} />
				</EntityId>
				<WatchButton
					entityType={EntityType.Coin}
					entityId={{
						$network: { chainId: coin.chainId },
						address: coin.address,
						interopAddress: coin.symbol,
					}}
				/>
			</li>
		{/each}
	</ul>
</main>
