<script lang="ts" generics="_CoinType extends import('$/constants/coin-instances.ts').CoinInstanceType = import('$/constants/coin-instances.ts').CoinInstanceType">
	// Types/constants
	import type { CoinInstance } from '$/constants/coin-instances.ts'
	import { CoinInstanceType } from '$/constants/coin-instances.ts'
	import { coinById } from '$/constants/coins.ts'
	import { draggable } from '$/components/Draggable.svelte.ts'
	import { IconShape } from '$/components/Icon.svelte'
	import { networksByChainId } from '$/constants/networks.ts'
	import { stringify } from '$/lib/stringify.ts'


	// Props
	let {
		coin,
		isDraggable = true,
		showName = false,
	}: {
		coin: CoinInstance
		isDraggable?: boolean
		showName?: boolean
	} = $props()


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
			{@const chainId = coin.$id.$network.chainId}
			{@const symbol = coin.symbol}
			{@const network = networksByChainId[chainId]}
			<CoinIcon
				coin={coinById[coin.coinId]!}
				src={coin.icon.original.url}
				alt={symbol ?? ''}
				subicon={
					network?.icon ?
						{
							src: network.icon,
							alt: chainId.toString(),
							shape: IconShape.Circle,
						}
					: undefined
				}
			/>
		{:else}
			{@const chainId = coin.$id.$network.chainId}
			{@const symbol = coin.symbol}
			<NetworkIcon networkId={{ chainId }} alt={chainId.toString()} />
		{/if}

		{#if coin.name || coin.symbol}
			{@const symbol = coin.symbol}
			<abbr
				class="coin"
				title={coin.type === CoinInstanceType.NativeCurrency ?
					'Native Currency'
				: coin.type === CoinInstanceType.Erc20Token ? coin.$id.address : undefined}
			>
				{showName && coin.name && symbol ?
					`${symbol} (${coin.name})`
				: symbol}
			</abbr>
		{/if}
	</span>
</div>


<style>
	.coin-name {
		.coin {
			color: var(--text-secondary);
			font-size: smaller;
			text-decoration: none;
			cursor: help;
		}
	}
</style>
