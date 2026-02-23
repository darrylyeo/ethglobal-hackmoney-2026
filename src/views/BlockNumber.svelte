<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import type { Network$Id } from '$/data/Network.ts'
	import { getBlockPath } from '$/lib/network-paths.ts'


	// Props
	let {
		networkId: networkIdProp,
		chainId: chainIdProp,
		blockNumber,
		isLinked = true,
	}: {
		networkId?: Network$Id
		chainId?: ChainId
		blockNumber: number
		isLinked?: boolean
	} = $props()


	// Components
	import EntityId from '$/components/EntityId.svelte'
</script>



<EntityId
	link={isLinked
		? getBlockPath(networkIdProp?.chainId ?? chainIdProp ?? (0 as ChainId), blockNumber)
		: undefined}
	draggableText={String(blockNumber)}
	className="block-number"
>
	{String(blockNumber)}
</EntityId>
