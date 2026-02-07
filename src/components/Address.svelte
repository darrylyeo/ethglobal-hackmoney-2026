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
		// (View options)
		format = AddressFormat.Full,
		linked = true,
	}: {
		network: Network$Id
		address: `0x${string}`
		ensName?: string
		format?: AddressFormat
		linked?: boolean
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
>
	{#if !ensName}
		<TruncatedValue value={address} />
	{:else}
		<span data-text="font-monospace">{ensName}</span>
	{/if}
</EntityId>
