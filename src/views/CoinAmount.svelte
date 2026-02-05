<script lang="ts" generics="_CoinType extends CoinType = CoinType">
	// Types/constants
	import { type Coin, CoinType } from '$/constants/coins'
	import type { StorkPriceRow } from '$/collections/stork-prices'
	import { networkConfigsByChainId } from '$/constants/networks'

	// Props
	let {
		coin,
		amount,
		draggable = true,
		showLabel = true,
		priceRow = null,
		showPriceTooltip = priceRow !== null,
	}: {
		coin: Coin
		amount?: bigint
		draggable?: boolean
		showLabel?: boolean
		priceRow?: StorkPriceRow | null
		showPriceTooltip?: boolean
	} = $props()

	// Functions
	import { stringify } from '$/lib/stringify'

	// Components
	import Icon from '$/components/Icon.svelte'
	import Tooltip from '$/components/Tooltip.svelte'
	import StorkPriceFeed from '$/views/StorkPriceFeed.svelte'
</script>

<div
	role="term"
	{draggable}
	ondragstart={draggable
		? (e) => {
				e.dataTransfer?.setData('text/plain', stringify(coin))
			}
		: undefined}
	data-row="inline wrap gap-1"
>
	{#if showPriceTooltip}
		<Tooltip contentProps={{ side: 'top' }}>
			{#snippet Content()}
				<StorkPriceFeed symbol={coin.symbol} {priceRow} />
			{/snippet}
			<span class="coin-amount">
				{#if amount !== undefined}
					<span class="balance">
						{#each new Intl.NumberFormat( undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6, compactDisplay: 'short' }, ).formatToParts(coin.decimals ? Number(amount) / Math.pow(10, coin.decimals) : Number(amount)) as part}
							<span data-part={part.type}>{part.value}</span>
						{/each}
					</span>
				{/if}

				<span class="coin" data-row="wrap">
					{#if coin.icon?.original?.url}
						{@const networkIconSrc =
							networkConfigsByChainId[coin.chainId]?.icon ??
							`/icons/chains/${coin.chainId}.svg`}
						{@const networkName =
							networkConfigsByChainId[coin.chainId]?.name ??
							`Chain ${coin.chainId}`}
						<span class="coin-icon">
							<Icon
								src={coin.icon.original.url}
								alt={coin.symbol ?? ''}
								size={16}
							/>
							{#if networkIconSrc}
								<span class="network-icon">
									<Icon
										src={networkIconSrc}
										alt={networkName}
										title={networkName}
										size={10}
									/>
								</span>
							{/if}
						</span>
					{/if}

					{#if showLabel && (coin.name || coin.symbol)}
						<abbr
							title={coin.type === CoinType.Native
								? 'Native Currency'
								: coin.address}
						>
							{coin.name && coin.symbol
								? `${coin.symbol} (${coin.name})`
								: coin.symbol}
						</abbr>
					{/if}
				</span>
			</span>
		</Tooltip>
	{:else}
		<span class="coin-amount">
			{#if amount !== undefined}
				<span class="balance">
					{#each new Intl.NumberFormat( undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6, compactDisplay: 'short' }, ).formatToParts(coin.decimals ? Number(amount) / Math.pow(10, coin.decimals) : Number(amount)) as part}
						<span data-part={part.type}>{part.value}</span>
					{/each}
				</span>
			{/if}

			<span class="coin" data-row="wrap">
				{#if coin.icon?.original?.url}
					{@const networkIconSrc =
						networkConfigsByChainId[coin.chainId]?.icon ??
						`/icons/chains/${coin.chainId}.svg`}
					{@const networkName =
						networkConfigsByChainId[coin.chainId]?.name ??
						`Chain ${coin.chainId}`}
					<span class="coin-icon">
						<Icon src={coin.icon.original.url} alt={coin.symbol ?? ''} size={16} />
						{#if networkIconSrc}
							<span class="network-icon">
								<Icon
									src={networkIconSrc}
									alt={networkName}
									title={networkName}
									size={10}
								/>
							</span>
						{/if}
					</span>
				{/if}

				{#if showLabel && (coin.name || coin.symbol)}
					<abbr
						title={coin.type === CoinType.Native
							? 'Native Currency'
							: coin.address}
					>
						{coin.name && coin.symbol
							? `${coin.symbol} (${coin.name})`
							: coin.symbol}
					</abbr>
				{/if}
			</span>
		</span>
	{/if}
</div>

<style>
	.coin-amount {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
	}

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
		display: inline-flex;
		gap: 0.35em;
		align-items: center;
	}

	.coin-icon {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.network-icon {
		position: absolute;
		right: -3px;
		bottom: -3px;
		border-radius: 999px;
		background: var(--surface-1);
		box-shadow: 0 0 0 1px var(--color-border);
		display: inline-flex;
	}

	abbr {
		text-decoration: none;
		cursor: help;
	}
</style>
