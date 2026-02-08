<script lang="ts">
	// Types/constants
	import { networkColorByChainId } from '$/constants/colors.ts'
	import { networkConfigsByChainId } from '$/constants/networks.ts'
	import { IconShape } from '$/components/Icon.svelte'

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
		subicon?: import('$/components/Icon.svelte').SubiconProps
	} = $props()

	// (Derived)
	const config = $derived(networkConfigsByChainId[chainId])
	const src = $derived(config?.icon)
	const backgroundColor = $derived(networkColorByChainId[chainId])
	const resolvedTitle = $derived(title ?? config?.name)

	// Components
	import Icon from '$/components/Icon.svelte'
</script>

{#if src}
	<Icon
		{src}
		{alt}
		title={resolvedTitle}
		{size}
		shape={IconShape.Square}
		{backgroundColor}
		{subicon}
		class={className}
	/>
{/if}
