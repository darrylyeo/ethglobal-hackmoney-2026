<script module lang="ts">
	// Types/constants
	export enum AddressFormat {
		Full = 'full',
		MiddleTruncated = 'middle-truncated',
	}
</script>

<script lang="ts">
	// Types/constants
	import type { Network$id } from '$/collections/networks'
	import { ENTITY_TYPE } from '$/constants/entity-types'
	import type { IntentDragPayload } from '$/lib/intents/types'

	// Props
	let {
		network,
		address,
		ensName,
		// (View options)
		format = AddressFormat.Full,
		linked = true,
	}: {
		network: Network$id
		address: `0x${string}`
		ensName?: string
		format?: AddressFormat
		linked?: boolean
	} = $props()

	// (Derived)
	const intent = $derived<IntentDragPayload>({
		entity: {
			type: ENTITY_TYPE.actor,
			id: {
				network,
				address,
			},
		},
		context: {
			source: 'address',
		},
	})

	// Components
	import EntityId from './EntityId.svelte'
	import TruncatedValue from './TruncatedValue.svelte'
</script>

<EntityId draggableText={address} className="address" {intent}>
	{#if !ensName}
		<TruncatedValue value={address} />
	{:else}
		<span data-text="font-monospace">{ensName}</span>
	{/if}
</EntityId>
