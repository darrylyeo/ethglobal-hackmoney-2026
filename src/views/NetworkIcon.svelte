<script lang="ts">
	// Types/constants
	import { networkColorByChainId } from '$/constants/colors.ts'
	import { networkConfigsByChainId } from '$/constants/networks.ts'
	import { type SubiconProps, IconShape } from '$/components/Icon.svelte'

	// Props
	let {
		chainId,
		class: className,
		size = 16,
		title = undefined,
		alt = '',
		subicon,
	}: {
		chainId: number
		class?: string
		size?: number | string
		title?: string
		alt?: string
		subicon?: SubiconProps
	} = $props()

	// (Derived)
	const config = $derived(networkConfigsByChainId[chainId])
	const src = $derived(config?.icon)
	const backgroundColor = $derived(networkColorByChainId[chainId])
	const resolvedTitle = $derived(title ?? config?.name)

	// Components
	import Icon from '$/components/Icon.svelte'
</script>


<Icon
	{src}
	{alt}
	title={resolvedTitle}
	{size}
	shape={IconShape.Square}
	backgroundColor={src ? undefined : backgroundColor}
	{subicon}
	class={className}
/>
