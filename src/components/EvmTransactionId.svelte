<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'


	// Props
	let {
		chainId,
		txHash,
		linked = true,
		full = true,
		vertical = false,
	}: {
		chainId: ChainId
		txHash: `0x${string}`
		linked?: boolean
		full?: boolean
		vertical?: boolean
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
	data-text={vertical ? 'vertical' : undefined}
>
	<TruncatedValue
		value={txHash}
		startLength={full ? txHash.length : 6}
		endLength={full ? 0 : 4}
	/>
</EntityId>
