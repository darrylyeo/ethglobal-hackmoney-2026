<script lang="ts">


	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'


	// Props
	let {
		chainId,
		blockNumber,
		linked = true,
	}: {
		chainId: ChainId
		blockNumber: number
		linked?: boolean
	} = $props()


	// Functions
	import { getBlockUrl } from '$/constants/explorers.ts'


	// Components
	import EntityId from '$/components/EntityId.svelte'
</script>


<EntityId
	link={linked ? getBlockUrl(chainId, blockNumber) : undefined}
	draggableText={String(blockNumber)}
	className="block-number"
>
	{String(blockNumber)}
</EntityId>
