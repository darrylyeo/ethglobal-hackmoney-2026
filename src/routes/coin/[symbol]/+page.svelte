<script lang="ts">
	// Types/constants
	import { page } from '$app/state'
	import { resolve } from '$app/paths'
	import { EntityType } from '$/data/$EntityType.ts'
	import { TIME_PERIODS } from '$/api/transfers-indexer.ts'
	import {
		COIN_SYMBOLS,
		coinBySymbol,
		type CoinSymbol,
	} from '$/constants/coins.ts'
	import EntityView from '$/components/EntityView.svelte'
	import CoinName from '$/views/CoinName.svelte'
	import CoinTransfers from '$/views/CoinTransfers.svelte'
	import TokenContracts from '$/views/TokenContracts.svelte'


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

<main id="main" data-column data-sticky-container>
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
				<nav data-row="start gap-2" aria-label="Time period">
					{#each TIME_PERIODS as p (p.value)}
						<a
							class="period-link"
							href="?period={p.value}"
							data-active={period === p.value ? '' : undefined}
						>
							{p.label}
						</a>
					{/each}
				</nav>
				<TokenContracts {symbol} />
				<CoinTransfers {symbol} {period} />
			</EntityView>
		</section>
	{/if}
</main>

<style>
	.period-link {
		padding: 0.25em 0.5em;
		border-radius: 0.25em;
		text-decoration: none;
		background: var(--color-bg-subtle);
		color: var(--color-text);
	}

	.period-link[data-active] {
		background: var(--accent-backgroundColor);
		color: var(--accent-color);
	}
</style>
