<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'


	// Props
	let {
		txHash,
		chainId,
		linked = true,
		full = true,
		vertical = false,
	}: {
		txHash: `0x${string}`
		chainId?: ChainId
		linked?: boolean
		full?: boolean
		vertical?: boolean
	} = $props()


	// Functions
	import { getTxPath } from '$/constants/networks.ts'


	// Components
	import EntityId from '$/components/EntityId.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'


	// (Derived)
	const link = $derived(
		chainId != null && linked ? getTxPath(chainId, txHash) : undefined,
	)
	const entityId = $derived(
		chainId != null ? { chainId, txHash } : undefined,
	)
</script>


<EntityId
	{link}
	draggableText={txHash}
	className="evm-transaction-id"
	data-text={vertical ? 'vertical' : undefined}
	entityType={EntityType.Transaction}
	entityId={entityId}
>
	<TruncatedValue
		value={txHash}
		startLength={full ? txHash.length : 6}
		endLength={full ? 0 : 4}
	/>
</EntityId>
