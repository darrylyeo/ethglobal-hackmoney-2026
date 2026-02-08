<script lang="ts">
	// Types/constants
	import type { Network$Id } from '$/data/Network.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import {
		ensureEvmActorProfile,
		evmActorProfilesCollection,
	} from '$/collections/evm-actor-profiles.ts'


	// Components
	import Address from '$/components/Address.svelte'
	import Icon from '$/components/Icon.svelte'


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


	// (Derived)
	const normalizedAddress = $derived(
		address.toLowerCase() as `0x${string}`,
	)
	const profileQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: evmActorProfilesCollection })
				.where(({ row }) =>
					and(
						eq(row.$id.chainId, network),
						eq(row.$id.address, normalizedAddress),
					),
				)
				.select(({ row }) => ({ row })),
		[() => network, () => normalizedAddress],
	)
	$effect(() => {
		if (profileProp != null) return
		ensureEvmActorProfile(network, normalizedAddress)
	})
	const profile = $derived(
		profileProp ?? profileQuery.data?.[0]?.row,
	)
</script>


<div data-row="center gap-2" class="evm-actor">
	{#if profile?.avatarUrl}
		<span class="evm-actor-avatar">
			<Icon
				src={profile.avatarUrl}
				alt=""
				size="1.5em"
			/>
		</span>
	{/if}

	<Address
		{network}
		{address}
		ensName={profile?.primaryName}
		format={format}
		{vertical}
	/>
</div>


<style>
	.evm-actor-avatar {
		display: inline-flex;
		inline-size: 1.5em;
		block-size: 1.5em;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
	}
</style>
