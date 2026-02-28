<script lang="ts" generics="_CoinType extends CoinInstance = CoinInstance">
	// Types/constants
	import { IconShape } from '$/components/Icon.svelte'
	import { CoinInstanceType, type CoinInstance } from '$/constants/coin-instances.ts'
	import { coinById } from '$/constants/coins.ts'
	import type { WithSource } from '$/constants/data-sources.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import type { StorkPrice } from '$/data/StorkPrice.ts'

	// Props
	let {
		coin,
		amount,
		isDraggable = true,
		showName = false,
		priceRow,
		showPriceTooltip = priceRow != null,
	}: {
		coin: CoinInstance
		amount?: bigint
		isDraggable?: boolean
		showName?: boolean
		priceRow?: WithSource<StorkPrice> | undefined
		showPriceTooltip?: boolean
	} = $props()

	// Functions
	import { stringify } from '$/lib/stringify.ts'

	// Actions
	import { draggable } from '$/components/Draggable.svelte.ts'

	// Components
	import Tooltip from '$/components/Tooltip.svelte'
	import CoinIcon from '$/views/CoinIcon.svelte'
	import NetworkIcon from '$/views/NetworkIcon.svelte'
	import StorkPriceFeed from '$/views/StorkPriceFeed.svelte'
</script>


<div
	class="coin-amount-root"
	role="term"
	{@attach draggable({ text: stringify(coin), enabled: isDraggable })}
	data-row="inline wrap gap-1"
>
	{#snippet CoinAmountBody()}
		{@const chainId = coin.$id.$network.chainId}

		{@const symbol = coin.symbol}

		{@const network = networksByChainId[chainId]}

		<span
			class="coin-amount"
			data-row="inline"
		>
			<span
				class="coin-icons"
				data-row="center gap-1"
			>
				{#if coin.icon?.original?.url}
					<CoinIcon
						coin={coinById[coin.coinId]!}
						src={coin.icon.original.url}
						alt={symbol ?? ''}
						subicon={(
							network?.icon
								? {
									src: network.icon,
									alt: chainId.toString(),
									shape: IconShape.Circle,
								}
								: undefined
						)}
					/>
				{:else}
					<NetworkIcon
						networkId={{ chainId }}
						alt={chainId.toString()}
					/>
				{/if}
			</span>

			<span data-row="inline align-baseline gap-1">
				{#if amount !== undefined}
					{@const rawNum = coin.decimals ? Number(amount) / Math.pow(10, coin.decimals) : Number(amount)}

					{@const balanceParts = new Intl.NumberFormat(undefined, {
						minimumFractionDigits: 2,
						maximumFractionDigits: 6,
						compactDisplay: 'short',
					}).formatToParts(rawNum)}
					<span class="balance">
						{#each balanceParts as part}
							<span
								class="balance-part"
								class:fraction={part.type === 'fraction'}
							>
								{part.value}
							</span>
						{/each}
					</span>
				{/if}

				{#if coin.name || symbol}
					<abbr
						class="coin-label"
						title={(
							coin.type === CoinInstanceType.NativeCurrency
								? 'Native Currency'
							: coin.type === CoinInstanceType.Erc20Token
								? coin.$id.address
							:
								undefined
						)}
					>
						{showName && coin.name && symbol
							? `${symbol} (${coin.name})`
							: symbol}
					</abbr>
				{/if}
			</span>
		</span>
	{/snippet}

	{#if showPriceTooltip}
		<Tooltip contentProps={{ side: 'top' }}>
			{#snippet Content()}
				<StorkPriceFeed
					symbol={coin.symbol}
					priceRow={priceRow ?? null}
				/>
			{/snippet}

			{@render CoinAmountBody()}
		</Tooltip>
	{:else}
		{@render CoinAmountBody()}
	{/if}
</div>


<style>
	.coin-amount-root {
		.coin-amount {
			.balance {
				font-weight: 600;
				font-variant-numeric: tabular-nums;

				> .balance-part.fraction {
					opacity: 0.6;
				}
			}

			.coin-label {
				color: var(--color-fg-muted);
				font-size: smaller;
				text-decoration: none;
				cursor: help;
			}
		}
	}
</style>
