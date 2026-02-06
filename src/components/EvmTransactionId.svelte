<script lang="ts">


	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'


	// Props
	let {
		chainId,
		txHash,
		linked = true,
	}: {
		chainId: ChainId
		txHash: `0x${string}`
		linked?: boolean
	} = $props()


	// Functions
	import { getTxUrl } from '$/constants/explorers.ts'


	// Components
	import EntityId from '$/components/EntityId.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
</script>


<EntityId
	link={linked ? getTxUrl(chainId, txHash) : undefined}
	draggableText={txHash}
	className="evm-transaction-id"
>
	<TruncatedValue value={txHash} />
</EntityId>
