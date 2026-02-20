<script module lang="ts">
	// Types/constants
	export enum AddressFormat {
		Full = 'full',
		MiddleTruncated = 'middle-truncated',
	}
</script>


<script lang="ts">
	// Types/constants
	import { resolve } from '$app/paths'
	import type { Network$Id } from '$/data/Network.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import {
		ensureEvmActorProfile,
		evmActorProfilesCollection,
	} from '$/collections/EvmActorProfiles.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { blo } from 'blo'


	// Props
	let {
		network,
		address,
		ensName: ensNameProp,
		format = AddressFormat.MiddleTruncated,
		isLinked = true,
		showAvatar = true,
		isVertical = false,
	}: {
		network?: Network$Id
		address: `0x${string}`
		ensName?: string
		format?: AddressFormat
		isLinked?: boolean
		showAvatar?: boolean
		isVertical?: boolean
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
					network != null
						? and(
								eq(row.$id.$network.chainId, network),
								eq(row.$id.address, normalizedAddress),
							)
						: and(
								eq(row.$id.$network.chainId, -1),
								eq(row.$id.$network.chainId, 0),
							),
				)
				.select(({ row }) => ({ row })),
		[() => network, () => normalizedAddress],
	)
	$effect(() => {
		if (network == null || ensNameProp != null) return
		ensureEvmActorProfile(network, normalizedAddress)
	})
	const profile = $derived(profileQuery.data?.[0]?.row)
	const ensName = $derived(ensNameProp ?? profile?.primaryName)


	// Components
	import EntityId from '$/components/EntityId.svelte'
	import Icon, { IconShape } from '$/components/Icon.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
</script>


<EntityId
	draggableText={address}
	className="address-text"
	entityType={network != null ? EntityType.Actor : undefined}
	entityId={{ ...(network != null && { network }), address }}
	link={isLinked ? resolve(`/account/${encodeURIComponent(address)}`) : undefined}
	data-link={isLinked ? 'camouflaged' : undefined}
	source="address"
	data-text={isVertical ? 'vertical' : undefined}
>
	<span data-row="inline gap-2">
		{#if showAvatar}
			{@const avatarSrc = profile?.avatarUrl ?? blo(address)}
			{@const networkIcon = network != null ? networksByChainId[network]?.icon : undefined}
			<Icon
				shape={!profile?.avatarUrl ? IconShape.Square : IconShape.Circle}
				src={avatarSrc}
				subicon={
					network && networkIcon ?
						{
							src: networkIcon,
							shape: IconShape.Circle,
							backgroundColor: networksByChainId[network]?.color,
						}
					:
						undefined
				}
			/>
		{/if}

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
	</span>
</EntityId>
