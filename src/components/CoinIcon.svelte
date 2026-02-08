<script lang="ts">
	// Types/constants
	import { coinColorBySymbol } from '$/constants/colors.ts'
	import { IconShape } from '$/components/Icon.svelte'

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

	// (Derived)
	const backgroundColor = $derived(
		coinColorBySymbol[symbol?.toUpperCase()] ?? coinColorBySymbol[symbol],
	)
	const subiconWithShape = $derived(
		subicon ? { ...subicon, shape: subicon.shape ?? IconShape.Circle } : undefined,
	)

	// Components
	import Icon from '$/components/Icon.svelte'
</script>

<Icon
	{src}
	{alt}
	{title}
	{size}
	shape={IconShape.Circle}
	{backgroundColor}
	subicon={subiconWithShape}
	class={className}
/>
