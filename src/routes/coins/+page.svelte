<script lang="ts">
	// Types/constants
	import { resolve } from '$app/paths'
	import { EntityType } from '$/data/$EntityType.ts'
	import { COIN_PAGE_SYMBOLS, getCoinForCoinPage } from '$/constants/coins.ts'
	import { getCoinIconUrl } from '$/lib/coin-icon.ts'

	// State
	let iconBySymbol = $state<Record<string, string>>({})

	// (Derived) / effects
	$effect(() => {
		Promise.all(
			COIN_PAGE_SYMBOLS.map(async (symbol) => [symbol, await getCoinIconUrl(symbol)] as const),
		).then((pairs) => {
			iconBySymbol = Object.fromEntries(pairs)
		})
	})

	// Components
	import CoinIcon from '$/components/CoinIcon.svelte'
	import EntityId from '$/components/EntityId.svelte'
	import WatchButton from '$/components/WatchButton.svelte'
</script>


<svelte:head>
	<title>Coins</title>
</svelte:head>


<main data-column="gap-2">
	<h1>Coins</h1>
	<ul data-column="gap-2">
		{#each COIN_PAGE_SYMBOLS as symbol (symbol)}
			{@const coin = getCoinForCoinPage(symbol)}
			{@const coinIconSrc = iconBySymbol[symbol]}
			<li data-row="start gap-2 align-center">
				{#if coinIconSrc}
					<CoinIcon src={coinIconSrc} symbol={coin.symbol} size="1.25em" />
				{/if}
				<EntityId
					link={resolve(`/coin/${symbol}`)}
					draggableText={coin.symbol}
					className=""
					entityType={EntityType.Coin}
					entityId={{ network: coin.chainId, address: coin.address }}
				>
					{coin.symbol}
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
