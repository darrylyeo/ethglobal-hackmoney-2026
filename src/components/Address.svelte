<script module lang="ts">
	// Types/constants
	export enum AddressFormat {
		Full = 'full',
		MiddleTruncated = 'middle-truncated',
	}
</script>


<script lang="ts">
	import type { Network$id } from '$/collections/networks'


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


	// Components
	import EntityId from './EntityId.svelte'
	import TruncatedValue from './TruncatedValue.svelte'
</script>


<EntityId
	draggableText={address}
	className="address"
>
	{#if !ensName}
		<TruncatedValue value={address} />
	{:else}
		<span data-text="font-monospace">{ensName}</span>
	{/if}
</EntityId>
