<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'


	// Props
	let {
		txHash,
		chainId,
		isLinked = true,
		isFull = true,
		isVertical = false,
	}: {
		txHash: `0x${string}`
		chainId?: ChainId
		isLinked?: boolean
		isFull?: boolean
		isVertical?: boolean
	} = $props()


	// Functions
	import { getTxPath } from '$/lib/network-paths.ts'


	// Components
	import EntityId from '$/components/EntityId.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
</script>


<EntityId
	link={
		chainId != null && isLinked
			? getTxPath(chainId, txHash)
			: undefined
	}
	draggableText={txHash}
	className="evm-transaction-id"
	data-text={isVertical
		? 'vertical'
		: undefined}
	entityType={EntityType.Transaction}
	entityId={
		chainId != null
			? { chainId, txHash }
			: undefined
	}
>
	<TruncatedValue
		value={txHash}
		startLength={isFull ? txHash.length : 6}
		endLength={isFull ? 0 : 4}
	/>
</EntityId>
