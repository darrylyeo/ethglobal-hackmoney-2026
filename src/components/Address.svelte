<script module lang="ts">
	// Types/constants
	export enum AddressFormat {
		Full = 'full',
		MiddleTruncated = 'middle-truncated',
	}
</script>


<script lang="ts">


	// Types/constants
	import type { Network$Id } from '$/data/Network.ts'
	import { EntityType } from '$/data/$EntityType.ts'


	// Props
	let {
		network,
		address,
		ensName,
		format = AddressFormat.Full,
		linked = true,
		vertical = false,
	}: {
		network: Network$Id
		address: `0x${string}`
		ensName?: string
		format?: AddressFormat
		linked?: boolean
		vertical?: boolean
	} = $props()


	// Components
	import EntityId from './EntityId.svelte'
	import TruncatedValue from './TruncatedValue.svelte'
</script>


<EntityId
	draggableText={address}
	className="address"
	entityType={EntityType.Actor}
	entityId={{ network, address }}
	source="address"
	data-text={vertical ? 'vertical' : undefined}
>
	<span data-text="font-monospace">
		<TruncatedValue
			value={address}
			startLength={format === AddressFormat.Full ? address.length : 6}
			endLength={format === AddressFormat.Full ? 0 : 4}
		/>
	</span>

	<small>
		{#if ensName}
			(<span data-text="font-monospace">{ensName}</span>)
		{/if}
	</small>
</EntityId>
