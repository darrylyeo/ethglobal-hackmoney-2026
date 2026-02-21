<script lang="ts" generics="_CoinType extends CoinType = CoinType">
	// Types/constants
	import type { Coin } from '$/constants/coins.ts'
	import { draggable } from '$/components/Draggable.svelte.ts'
	import { IconShape } from '$/components/Icon.svelte'
	import { CoinType } from '$/constants/coins.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { stringify } from '$/lib/stringify.ts'


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


	// Components
	import CoinIcon from '$/views/CoinIcon.svelte'
	import NetworkIcon from '$/views/NetworkIcon.svelte'
</script>


<div
	role="term"
	{@attach draggable({ text: stringify(coin), enabled: isDraggable })}
	data-row="inline wrap gap-1"
>
	{#if true}
		{@const network = networksByChainId[coin.chainId]}
		<span class="coin-name" data-row="inline gap-1">
			{#if coin.icon?.original?.url}
				<CoinIcon
					src={coin.icon.original.url}
					symbol={coin.symbol ?? ''}
					alt={coin.symbol ?? ''}
					subicon={
						network?.icon ?
							{
								src: network.icon,
								alt: coin.chainId.toString(),
								shape: IconShape.Circle,
							}
						: undefined
					}
				/>
			{:else}
				<NetworkIcon chainId={coin.chainId} alt={coin.chainId.toString()} />
			{/if}

			{#if coin.name || coin.symbol}
				<abbr
					class="coin"
					title={coin.type === CoinType.Native ?
						'Native Currency'
					: coin.address}
				>
					{showName && coin.name && coin.symbol ?
						`${coin.symbol} (${coin.name})`
					: coin.symbol}
				</abbr>
			{/if}
		</span>
	{/if}
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
