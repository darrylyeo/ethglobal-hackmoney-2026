<script lang="ts" generics="_CoinType extends CoinType = CoinType">
	// Types/constants
	import { type Coin, CoinType } from '$/constants/coins.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { IconShape } from '$/components/Icon.svelte'


	// Props
	let {
		coin,
		isDraggable = true,
		showName = false,
	}: {
		coin: Coin
		isDraggable?: boolean
		showName?: boolean
	} = $props()


	// (Derived)
	const network = $derived(networksByChainId[coin.chainId])
	const networkSubicon = $derived(
		network?.icon
			? {
					src: network.icon,
					alt: coin.chainId.toString(),
					shape: IconShape.Circle,
				}
			: undefined,
	)


	// Functions
	import { draggable } from '$/components/Draggable.svelte.ts'
	import { stringify } from '$/lib/stringify.ts'


	// Components
	import CoinIcon from '$/views/CoinIcon.svelte'
	import NetworkIcon from '$/views/NetworkIcon.svelte'
</script>


<div
	role="term"
	{@attach draggable({ text: stringify(coin), enabled: isDraggable })}
	data-row="inline wrap gap-1"
>
	<span class="coin-name" data-row="inline gap-1">
		{#if coin.icon?.original?.url}
			<CoinIcon
				src={coin.icon.original.url}
				symbol={coin.symbol ?? ''}
				alt={coin.symbol ?? ''}
				subicon={networkSubicon}
			/>
		{:else}
			<NetworkIcon chainId={coin.chainId} alt={coin.chainId.toString()} />
		{/if}

		{#if coin.name || coin.symbol}
			<abbr
				class="coin"
				title={coin.type === CoinType.Native
					? 'Native Currency'
					: coin.address}
			>
				{showName && coin.name && coin.symbol
					? `${coin.symbol} (${coin.name})`
					: coin.symbol}
			</abbr>
		{/if}
	</span>
</div>


<style>
	.coin {
		color: var(--text-secondary);
		font-size: smaller;
	}

	abbr {
		text-decoration: none;
		cursor: help;
	}
</style>
