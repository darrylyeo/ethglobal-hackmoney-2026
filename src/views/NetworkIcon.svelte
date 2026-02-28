<script lang="ts">
	// Types/constants
	import type { Network$Id } from '$/data/Network.ts'
	import type { SubiconProps } from '$/components/Icon.svelte'
	import { IconShape } from '$/components/Icon.svelte'
	import { networksByChainId } from '$/constants/networks.ts'


	// Props
	let {
		networkId: networkIdProp,
		chainId: chainIdProp,
		class: className,
		size = '1em',
		title = undefined,
		alt = '',
		subicon,
	}: {
		networkId?: Network$Id
		chainId?: number
		class?: string
		size?: number | string
		title?: string
		alt?: string
		subicon?: SubiconProps
	} = $props()

	// (Derived)
	const network = $derived.by(() => {
		const c = networkIdProp?.chainId ?? chainIdProp
		return c != null ? networksByChainId[c] : undefined
	})


	// Components
	import Icon from '$/components/Icon.svelte'
</script>


<Icon
	src={network?.icon}
	{alt}
	title={title ?? network?.name}
	{size}
	shape={IconShape.Square}
	backgroundColor={network?.icon
		? undefined
		: network?.color}
	{subicon}
	class={className}
/>
