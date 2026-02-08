<script lang="ts">
	// Types/constants
	import type { Network$Id } from '$/data/Network.ts'

	// Components
	import Address from '$/components/Address.svelte'

	// Props
	let {
		network,
		address,
		profile: profileProp,
		format,
		vertical = false,
	}: {
		network: Network$Id
		address: `0x${string}`
		profile?: { primaryName?: string; avatarUrl?: string }
		format?: import('$/components/Address.svelte').AddressFormat
		vertical?: boolean
	} = $props()
</script>


<Address
	{network}
	{address}
	ensName={profileProp?.primaryName}
	format={format}
	{vertical}
	showAvatar={true}
/>
