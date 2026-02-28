<script lang="ts">
	// Types/constants
	import type { SubiconProps } from '$/components/Icon.svelte'
	import { IconShape } from '$/components/Icon.svelte'
	import { CoinId, coinById, type Coin } from '$/constants/coins.ts'


	// Props
	let {
		coin,
		src,
		symbol,
		class: className,
		size = '1em',
		title = undefined,
		alt = '',
		subicon,
	}: {
		coin: Coin
		src?: string
		symbol?: string
		class?: string
		size?: number | string
		title?: string
		alt?: string
		subicon?: SubiconProps
	} = $props()

	// (Derived)
	const effectiveSrc = $derived(
		src ?? coin.icon ?? coinById[CoinId.ETH]?.icon ?? ''
	)
	const effectiveSymbol = $derived(
		symbol ?? coin.symbol ?? ''
	)
	const backgroundColor = $derived(
		coin.color
	)

	// Components
	import Icon from '$/components/Icon.svelte'
</script>


<Icon
	src={effectiveSrc}
	alt={alt || effectiveSymbol}
	title={title}
	{size}
	shape={IconShape.Circle}
	{backgroundColor}
	subicon={subicon ?
		{ ...subicon, shape: subicon.shape ?? IconShape.Circle }
		: undefined}
	class={className}
/>
