<script lang="ts">
	// Types/constants
	import {
		coinInstanceByChainAndCoinId,
		erc20InstancesByCoinId,
	} from '$/constants/coin-instances.ts'
	import { coinById, CoinId } from '$/constants/coins.ts'
	import { ChainId } from '$/constants/networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'


	// (Derived)
	const route = $derived(
		(() => {
			const param = page.params.coinId ?? ''
			const coinId = coinById[param as CoinId] ? (param as CoinId) : null
			const coin = coinId
				? (coinInstanceByChainAndCoinId.get(`${ChainId.Ethereum}:${coinId}`)
					?? erc20InstancesByCoinId.get(coinId)?.[0])
				: null
			return { param, coinId, coin }
		})(),
	)


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import CoinActivity from '$/views/CoinActivity.svelte'
	import CoinContracts from '$/views/CoinContracts.svelte'
	import CoinName from '$/views/CoinName.svelte'
</script>


<svelte:head>
	<title>
		{route.coinId ? coinById[route.coinId]?.symbol ?? route.coinId : route.param || 'Coin'} – Coin
	</title>
</svelte:head>


<main>
	{#if !route.coinId}
		<h1>Not found</h1>
		<p>
			{route.param ?
				`Unsupported coin: ${route.param}`
			: 'Coin required'}
		</p>
	{:else if route.coin}
		{@const coin = route.coin}

		<section data-scroll-item>
			<EntityView
				entityType={EntityType.Coin}
				entity={coin}
				titleHref={resolve(`/coin/${route.coinId}`)}
				label={coin.symbol}
				annotation="Coin"
			>
				{#snippet Title()}
					<CoinName {coin} />
				{/snippet}
				<CoinContracts coinId={coin.coinId} />
				<CoinActivity
					coinId={route.coinId}
					period={page.url.searchParams.get('period') ?? '1d'}
				/>
			</EntityView>
		</section>
	{/if}
</main>
