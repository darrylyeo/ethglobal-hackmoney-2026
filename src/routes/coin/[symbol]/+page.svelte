<script lang="ts">
	// Types/constants
	import { page } from '$app/state'
	import { resolve } from '$app/paths'
	import { EntityType } from '$/data/$EntityType.ts'
	import {
		COIN_SYMBOLS,
		coinBySymbol,
		type CoinSymbol,
	} from '$/constants/coins.ts'
	import EntityView from '$/components/EntityView.svelte'
	import CoinName from '$/views/CoinName.svelte'
	import CoinContracts from '$/views/CoinContracts.svelte'
	import CoinActivity from '$/views/CoinActivity.svelte'


	// (Derived)
	const symbolParam = $derived((page.params.symbol ?? '').toUpperCase())
	const symbol = $derived(
		COIN_SYMBOLS.includes(symbolParam as CoinSymbol)
			? (symbolParam as CoinSymbol)
			: null,
	)
	const period = $derived(page.url.searchParams.get('period') ?? '1d')
	const coin = $derived(symbol ? coinBySymbol[symbol] : null)
</script>


<svelte:head>
	<title>{symbol ? symbol : (symbolParam || 'Coin')} – Coin</title>
</svelte:head>


<main>
	{#if !symbol}
		<h1>Not found</h1>
		<p>
			{symbolParam
				? `Unsupported coin symbol: ${symbolParam}`
				: 'Coin symbol required'}
		</p>
	{:else}
		<section data-scroll-item>
			<EntityView
				entityType={EntityType.Coin}
				idSerialized={symbol}
				href={resolve(`/coin/${symbol}`)}
				label={coin!.symbol}
				annotation="Coin"
			>
				{#snippet Title()}
					<CoinName coin={coin!} />
				{/snippet}
				<CoinContracts {symbol} />
				<CoinActivity {symbol} {period} />
			</EntityView>
		</section>
	{/if}
</main>
