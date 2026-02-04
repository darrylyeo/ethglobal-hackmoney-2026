<script lang="ts" generics="_CoinType extends CoinType = CoinType">
	// Types/constants
	import { type Coin, CoinType } from '$/constants/coins'

	// Props
	let {
		coin,
		amount,
		draggable = true,
	}: {
		coin: Coin
		amount?: bigint
		draggable?: boolean
	} = $props()

	// Functions
	import { stringify } from '$/lib/stringify'

	// Components
	import Icon from '$/components/Icon.svelte'
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
	{#if amount !== undefined}
		<span class="balance">
			{#each new Intl.NumberFormat( undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6, compactDisplay: 'short' }, ).formatToParts(coin.decimals ? Number(amount) / Math.pow(10, coin.decimals) : Number(amount)) as part}
				<span data-part={part.type}>{part.value}</span>
			{/each}
		</span>
	{/if}

	<span class="coin" data-row="wrap">
		{#if coin.icon?.original?.url}
			<Icon src={coin.icon.original.url} alt={coin.symbol ?? ''} size={16} />
		{/if}

		{#if coin.name || coin.symbol}
			<abbr
				title={coin.type === CoinType.Native ? 'Native Currency' : coin.address}
			>
				{coin.name && coin.symbol
					? `${coin.symbol} (${coin.name})`
					: coin.symbol}
			</abbr>
		{/if}
	</span>
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
