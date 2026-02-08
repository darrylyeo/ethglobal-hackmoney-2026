<script lang="ts" generics="_CoinType extends CoinType = CoinType">
	// Types/constants
	import { type Coin, CoinType } from '$/constants/coins.ts'
	import type { StorkPriceRow } from '$/collections/stork-prices.ts'
	import { networkConfigsByChainId } from '$/constants/networks.ts'


	// Props
	let {
		coin,
		amount,
		draggable = true,
		showLabel = true,
		symbolOnly = false,
		priceRow = null,
		showPriceTooltip = priceRow !== null,
	}: {
		coin: Coin
		amount?: bigint
		draggable?: boolean
		showLabel?: boolean
		symbolOnly?: boolean
		priceRow?: StorkPriceRow | null
		showPriceTooltip?: boolean
	} = $props()


	// Functions
	import { draggable as draggableAttachment } from '$/components/Draggable.svelte.ts'
	import { stringify } from '$/lib/stringify.ts'


	// Components
	import Icon from '$/components/Icon.svelte'
	import Tooltip from '$/components/Tooltip.svelte'
	import StorkPriceFeed from '$/views/StorkPriceFeed.svelte'
</script>


<div
	role="term"
	{@attach draggableAttachment({ text: stringify(coin), enabled: draggable })}
	data-row="inline wrap gap-1"
>
	{#if showPriceTooltip}
		<Tooltip contentProps={{ side: 'top' }}>
			{#snippet Content()}
				<StorkPriceFeed symbol={coin.symbol} {priceRow} />
			{/snippet}
			<span class="coin-amount" data-row="start gap-2">
				{#if amount !== undefined}
					<span class="balance">
						{#each new Intl.NumberFormat( undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6, compactDisplay: 'short' }, ).formatToParts(coin.decimals ? Number(amount) / Math.pow(10, coin.decimals) : Number(amount)) as part}
							<span data-part={part.type}>{part.value}</span>
						{/each}
					</span>
				{/if}

				{#if showLabel && (coin.name || coin.symbol)}
					<abbr
						class="coin"
						title={coin.type === CoinType.Native
							? 'Native Currency'
							: coin.address}
					>
						{symbolOnly || !(coin.name && coin.symbol)
							? coin.symbol
							: `${coin.symbol} (${coin.name})`}
					</abbr>
				{/if}

				{#if coin.icon?.original?.url}
					{@const networkIconSrc = networkConfigsByChainId[coin.chainId]?.icon}
					{@const networkName =
						networkConfigsByChainId[coin.chainId]?.name ??
						`Chain ${coin.chainId}`}
					<span class="coin-icons" data-row="center gap-1">
						<Icon
							src={coin.icon.original.url}
							alt={coin.symbol ?? ''}
							size={16}
						/>
						{#if networkIconSrc}
							<Icon
								src={networkIconSrc}
								alt={networkName}
								title={networkName}
								size={10}
							/>
						{/if}
					</span>
				{/if}
			</span>
		</Tooltip>
	{:else}
		<span class="coin-amount" data-row="start gap-2">
			{#if amount !== undefined}
				<span class="balance">
					{#each new Intl.NumberFormat( undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6, compactDisplay: 'short' }, ).formatToParts(coin.decimals ? Number(amount) / Math.pow(10, coin.decimals) : Number(amount)) as part}
						<span data-part={part.type}>{part.value}</span>
					{/each}
				</span>
			{/if}

			{#if showLabel && (coin.name || coin.symbol)}
				<abbr
					class="coin"
					title={coin.type === CoinType.Native
						? 'Native Currency'
						: coin.address}
				>
					{symbolOnly || !(coin.name && coin.symbol)
						? coin.symbol
						: `${coin.symbol} (${coin.name})`}
				</abbr>
			{/if}

			{#if coin.icon?.original?.url}
				{@const networkIconSrc = networkConfigsByChainId[coin.chainId]?.icon}
				{@const networkName =
					networkConfigsByChainId[coin.chainId]?.name ??
					`Chain ${coin.chainId}`}
				<span class="coin-icons" data-row="center gap-1">
					<Icon
						src={coin.icon.original.url}
						alt={coin.symbol ?? ''}
						size={16}
					/>
					{#if networkIconSrc}
						<Icon
							src={networkIconSrc}
							alt={networkName}
							title={networkName}
							size={10}
						/>
					{/if}
				</span>
			{/if}
		</span>
	{/if}
</div>


<style>
	.balance {
		font-weight: 600;
		font-variant-numeric: tabular-nums;

		> [data-part='fraction'] {
			opacity: 0.6;
		}
	}

	.coin-amount {
		position: relative;
		padding-inline-end: 1.75em;
		padding-block-end: 0.25em;
	}

	.coin {
		color: var(--text-secondary);
		font-size: smaller;
	}

	.coin-icons {
		position: absolute;
		right: 0;
		bottom: 0;
		border-radius: 999px;
		background: var(--surface-1);
		box-shadow: 0 0 0 1px var(--color-border);
		display: inline-flex;
		padding: 1px;
	}

	abbr {
		text-decoration: none;
		cursor: help;
	}
</style>
