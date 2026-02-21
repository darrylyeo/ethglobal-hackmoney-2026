<script lang="ts">
	// Types/constants
	import type { CoinSymbol } from '$/constants/coins.ts'
	import {
		COIN_SYMBOLS,
		coinBySymbol,
	} from '$/constants/coins.ts'
	import { EntityType } from '$/data/$EntityType.ts'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'


	// (Derived)
	const symParam = $derived((page.params.symbol ?? '').toUpperCase())
	const symbol = $derived(
		COIN_SYMBOLS.includes(symParam as CoinSymbol) ?
			(symParam as CoinSymbol)
		: null,
	)
	const coin = $derived(symbol ? coinBySymbol[symbol] : null)


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import CoinActivity from '$/views/CoinActivity.svelte'
	import CoinContracts from '$/views/CoinContracts.svelte'
	import CoinName from '$/views/CoinName.svelte'
</script>


<svelte:head>
	<title>
		{symbol ?? symParam ?? 'Coin'} – Coin
	</title>
</svelte:head>


<main>
	{#if !symbol}
		<h1>Not found</h1>
		<p>
			{symParam ?
				`Unsupported coin symbol: ${symParam}`
			: 'Coin symbol required'}
		</p>
	{:else if coin}
		<section data-scroll-item>
			<EntityView
				entityType={EntityType.Coin}
				entityId={{
					$network: { chainId: coin.chainId },
					address: coin.address,
					interopAddress: coin.symbol,
				}}
				idSerialized={symbol}
				href={resolve(`/coin/${symbol}`)}
				label={coin.symbol}
				annotation="Coin"
			>
				{#snippet Title()}
					<CoinName {coin} />
				{/snippet}
				<CoinContracts {symbol} />
				<CoinActivity
					{symbol}
					period={page.url.searchParams.get('period') ?? '1d'}
				/>
			</EntityView>
		</section>
	{/if}
</main>
