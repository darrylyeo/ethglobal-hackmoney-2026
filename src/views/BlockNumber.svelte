<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import { getBlockPath } from '$/lib/network-paths.ts'


	// Props
	let {
		chainId,
		blockNumber,
		isLinked = true,
	}: {
		chainId: ChainId
		blockNumber: number
		isLinked?: boolean
	} = $props()


	// Components
	import EntityId from '$/components/EntityId.svelte'
</script>



<EntityId
	link={isLinked
		? getBlockPath(chainId, blockNumber)
		: undefined}
	draggableText={String(blockNumber)}
	className="block-number"
>
	{String(blockNumber)}
</EntityId>
