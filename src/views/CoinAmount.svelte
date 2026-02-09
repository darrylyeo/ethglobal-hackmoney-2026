<script lang="ts" generics="_CoinType extends CoinType = CoinType">
	// Types/constants
	import { type Coin, CoinType } from '$/constants/coins.ts'
	import { networkConfigsByChainId } from '$/constants/networks.ts'
	import type { StorkPriceRow } from '$/collections/StorkPrices.ts'
	import { IconShape } from '$/components/Icon.svelte'


	// Props
	let {
		coin,
		amount,
		draggable = true,
		showLabel = true,
		showIcon = false,
		symbolOnly = false,
		priceRow = null,
		showPriceTooltip = priceRow !== null,
	}: {
		coin: Coin
		amount?: bigint
		draggable?: boolean
		showLabel?: boolean
		showIcon?: boolean
		symbolOnly?: boolean
		priceRow?: StorkPriceRow | null
		showPriceTooltip?: boolean
	} = $props()


	// (Derived)
	const networkConfig = $derived(networkConfigsByChainId[coin.chainId])
	const networkSubicon = $derived(
		networkConfig?.icon
			? {
					src: networkConfig.icon,
					alt: coin.chainId.toString(),
					size: 10,
					shape: IconShape.Circle,
				}
			: undefined,
	)


	// Functions
	import { draggable as draggableAttachment } from '$/components/Draggable.svelte.ts'
	import { stringify } from '$/lib/stringify.ts'


	// Components
	import CoinIcon from '$/components/CoinIcon.svelte'
	import NetworkIcon from '$/components/NetworkIcon.svelte'
	import Tooltip from '$/components/Tooltip.svelte'
	import StorkPriceFeed from '$/views/StorkPriceFeed.svelte'
</script>


<div
	role="term"
	{@attach draggableAttachment({ text: stringify(coin), enabled: draggable })}
	data-row="inline wrap gap-1"
>
	{#snippet coinAmountBody()}
		<span class="coin-amount" data-row="inline gap-2">
			{#if showIcon || coin.icon?.original?.url}
				<span class="coin-icons" data-row="center gap-1">
					{#if coin.icon?.original?.url}
						<CoinIcon
							src={coin.icon.original.url}
							symbol={coin.symbol ?? ''}
							alt={coin.symbol ?? ''}
							size={16}
							subicon={networkSubicon}
						/>
					{:else}
						<NetworkIcon chainId={coin.chainId} alt={coin.chainId.toString()} size={10} />
					{/if}
				</span>
			{/if}

			<span data-row="inline align-baseline gap-1">
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
			</span>
		</span>
	{/snippet}

	{#if showPriceTooltip}
		<Tooltip contentProps={{ side: 'top' }}>
			{#snippet Content()}
				<StorkPriceFeed symbol={coin.symbol} {priceRow} />
			{/snippet}
			{@render coinAmountBody()}
		</Tooltip>
	{:else}
		{@render coinAmountBody()}
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


	.coin {
		color: var(--text-secondary);
		font-size: smaller;
	}

	abbr {
		text-decoration: none;
		cursor: help;
	}
</style>
