<script lang="ts">
	// Types/constants
	import { networksByChainId } from '$/constants/networks.ts'
	import { type SubiconProps, IconShape } from '$/components/Icon.svelte'


	// Props
	let {
		chainId,
		class: className,
		size = '1em',
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
	const network = $derived(networksByChainId[chainId])
	const src = $derived(network?.icon)
	const backgroundColor = $derived(networksByChainId[chainId]?.color)
	const resolvedTitle = $derived(title ?? network?.name)


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
