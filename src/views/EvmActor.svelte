<script lang="ts">
	// Types/constants
	import type { Network$Id } from '$/data/Network.ts'
	import { AddressFormat } from '$/views/Address.svelte'


	// Props
	let {
		network,
		address,
		profile: profileProp,
		format,
		isVertical = false,
	}: {
		network: Network$Id
		address: `0x${string}`
		profile?: { primaryName?: string; avatarUrl?: string }
		format?: AddressFormat
		isVertical?: boolean
	} = $props()


	// Components
	import Address from '$/views/Address.svelte'
</script>


<Address
	{network}
	{address}
	ensName={profileProp?.primaryName}
	format={format}
	{isVertical}
	showAvatar={true}
/>
