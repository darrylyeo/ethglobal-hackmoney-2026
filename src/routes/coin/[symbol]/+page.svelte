<script lang="ts">
	// Types/constants
	import { page } from '$app/state'
	import { resolve } from '$app/paths'
	import { EntityType } from '$/data/$EntityType.ts'
	import { TIME_PERIODS } from '$/api/transfers-indexer.ts'
	import { getCoinForCoinPage, type CoinPageSymbol } from '$/constants/coins.ts'
	import WatchButton from '$/components/WatchButton.svelte'
	import CoinTransfers from '$/views/CoinTransfers.svelte'

	// Props (from load)
	let { data }: { data: { symbol: CoinPageSymbol } } = $props()

	// (Derived)
	const symbol = $derived(data.symbol)
	const period = $derived(page.url.searchParams.get('period') ?? '1d')
	const coin = $derived(getCoinForCoinPage(symbol))
</script>

<svelte:head>
	<title>{symbol} – Coin</title>
</svelte:head>

<main id="main" data-column data-sticky-container>
	<section data-scroll-item>
		<header data-column="gap-2">
			<div data-row="wrap gap-4">
				<div data-row="start gap-2" data-row-item="flexible">
					<h1>{coin.symbol}</h1>
					<WatchButton
						entityType={EntityType.Coin}
						id={symbol}
						label={coin.symbol}
						href={resolve(`/coin/${symbol}`)}
					/>
				</div>
				<div data-row="gap-2">
					<span data-text="annotation">Coin</span>
				</div>
			</div>
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
		</header>
		<CoinTransfers {symbol} {period} />
	</section>
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
