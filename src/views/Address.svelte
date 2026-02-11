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
	import { networkColorByChainId } from '$/constants/colors.ts'
	import { networkConfigsByChainId } from '$/constants/networks.ts'
	import { blo } from 'blo'


	// Props
	let {
		network,
		address,
		ensName: ensNameProp,
		format = AddressFormat.MiddleTruncated,
		linked = true,
		showAvatar = true,
		vertical = false,
	}: {
		network?: Network$Id
		address: `0x${string}`
		ensName?: string
		format?: AddressFormat
		linked?: boolean
		showAvatar?: boolean
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
					network != null
						? and(
								eq(row.$id.chainId, network),
								eq(row.$id.address, normalizedAddress),
							)
						: and(eq(row.$id.chainId, -1), eq(row.$id.chainId, 0)),
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
	link={linked ? resolve(`/account/${encodeURIComponent(address)}`) : undefined}
	data-link={linked ? 'camouflaged' : undefined}
	source="address"
	data-text={vertical ? 'vertical' : undefined}
>
	<span data-row="inline gap-2">
		{#if showAvatar}
			{@const avatarSrc = profile?.avatarUrl ?? blo(address)}
			{@const networkIcon = network != null ? networkConfigsByChainId[network]?.icon : undefined}
			<Icon
				shape={!profile?.avatarUrl ? IconShape.Square : IconShape.Circle}
				src={avatarSrc}
				alt=""
				size="1em"
				subicon={
					network && networkIcon ?
						{
							src: networkIcon,
							shape: IconShape.Circle,
							alt: '',
							backgroundColor: networkColorByChainId[network],
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
