<script lang="ts">
	// Types/constants
	import { coinColorBySymbol } from '$/constants/coins.ts'
	import { type SubiconProps, IconShape } from '$/components/Icon.svelte'

	// Props
	let {
		src,
		symbol,
		class: className,
		size = '1em',
		title = undefined,
		alt = '',
		subicon,
	}: {
		src: string
		symbol: string
		class?: string
		size?: number | string
		title?: string
		alt?: string
		subicon?: SubiconProps
	} = $props()

	// Components
	import Icon from '$/components/Icon.svelte'
</script>

<Icon
	{src}
	{alt}
	{title}
	{size}
	shape={IconShape.Circle}
	backgroundColor={
		coinColorBySymbol[symbol?.toUpperCase() as keyof typeof coinColorBySymbol]?.color ??
			coinColorBySymbol[symbol as keyof typeof coinColorBySymbol]?.color
	}
	subicon={subicon ?
		{ ...subicon, shape: subicon.shape ?? IconShape.Circle }
	: undefined}
	class={className}
/>
