<script lang="ts">
	// Types/constants
	import type { Actor$Id } from '$/data/Actor.ts'
	import type { Network$Id } from '$/data/Network.ts'
	import { AddressFormat } from '$/views/Address.svelte'


	// Props
	let {
		actorId: actorIdProp,
		network,
		address,
		profile: profileProp,
		format,
		isVertical = false,
	}: {
		actorId?: Actor$Id | null
		network?: Network$Id
		address?: `0x${string}`
		profile?: { primaryName?: string; avatarUrl?: string }
		format?: AddressFormat
		isVertical?: boolean
	} = $props()


	// Components
	import Address from '$/views/Address.svelte'
</script>


<Address
	actorId={actorIdProp}
	network={network}
	address={address}
	ensName={profileProp?.primaryName}
	format={format}
	{isVertical}
	showAvatar={true}
/>
