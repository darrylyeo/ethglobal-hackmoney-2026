<script lang="ts">
	// Types/constants
	import {
		coinInstanceByChainAndCoinId,
		erc20InstancesByCoinId,
	} from '$/constants/coin-instances.ts'
	import { coins } from '$/constants/coins.ts'
	import { ChainId } from '$/constants/networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'


	// Context
	import { resolve } from '$app/paths'


	// (Derived)
	const coinsWithInstance = $derived(
		coins
			.map((c) => ({
				coinId: c.id,
				coin:
					coinInstanceByChainAndCoinId.get(`${ChainId.Ethereum}:${c.id}`)
					?? erc20InstancesByCoinId.get(c.id)?.[0],
			}))
			.filter(({ coin }) => coin != null),
	)


	// Components
	import EntityId from '$/components/EntityId.svelte'
	import WatchButton from '$/components/WatchButton.svelte'
	import CoinName from '$/views/CoinName.svelte'
</script>


<svelte:head>
	<title>Coins</title>
</svelte:head>


<main data-column>
	<h1>Coins</h1>
	<ul data-column>
		{#each coinsWithInstance as { coinId, coin } (coinId)}
			<li data-row="start align-center">
				<EntityId
					link={resolve(`/coin/${coinId}`)}
					draggableText={coin.symbol}
					className=""
					entityType={EntityType.Coin}
					entityId={coin.$id}
				>
					<CoinName {coin} />
				</EntityId>
				<WatchButton
					entityType={EntityType.Coin}
					entityId={coin.$id}
				/>
			</li>
		{/each}
	</ul>
</main>
