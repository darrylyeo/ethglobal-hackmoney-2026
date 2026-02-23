<script module lang="ts">
	// Types/constants
	export enum AddressFormat {
		Full = 'full',
		MiddleTruncated = 'middle-truncated',
	}
</script>


<script lang="ts">
	// Types/constants
	import type { Actor$Id } from '$/data/Actor.ts'
	import type { Network$Id } from '$/data/Network.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { resolve } from '$app/paths'
	import {
		ensureEvmActorProfile,
		evmActorProfilesCollection,
	} from '$/collections/EvmActorProfiles.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { blo } from 'blo'

	// Props
	let {
		actorId: actorIdProp,
		network,
		address,
		ensName: ensNameProp,
		format = AddressFormat.MiddleTruncated,
		isLinked = true,
		showAvatar = true,
		isVertical = false,
	}: {
		actorId?: Actor$Id | null
		network?: Network$Id
		address?: `0x${string}`
		ensName?: string
		format?: AddressFormat
		isLinked?: boolean
		showAvatar?: boolean
		isVertical?: boolean
	} = $props()

	// (Derived)
	const networkResolved = $derived(actorIdProp?.$network ?? network)
	const addressResolved = $derived(actorIdProp?.address ?? address ?? undefined)
	const normalizedAddress = $derived(
		(addressResolved?.toLowerCase() ?? '') as `0x${string}`,
	)

	// State
	const profileQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: evmActorProfilesCollection })
				.where(({ row }) =>
					networkResolved != null
						? and(
							eq(row.$id.$network.chainId, networkResolved.chainId),
							eq(row.$id.address, normalizedAddress),
						)
						: and(
							eq(row.$id.$network.chainId, -1),
							eq(row.$id.$network.chainId, 0),
						),
				)
				.select(({ row }) => ({ row })),
		[() => networkResolved, () => normalizedAddress],
	)

	// (Derived)
	const profile = $derived(
		profileQuery.data?.[0]?.row,
	)
	const ensName = $derived(
		ensNameProp ?? profile?.primaryName,
	)

	// Actions
	$effect(() => {
		if (networkResolved == null || ensNameProp != null || !addressResolved) return
		ensureEvmActorProfile(networkResolved.chainId, normalizedAddress)
	})

	// Components
	import EntityId from '$/components/EntityId.svelte'
	import Icon, { IconShape } from '$/components/Icon.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
</script>


{#if addressResolved}
<EntityId
	draggableText={addressResolved}
	className="address-text"
	entityType={networkResolved != null
		? EntityType.Actor
		: undefined}
	entityId={{ ...(networkResolved != null && { network: networkResolved }), address: addressResolved }}
	link={isLinked
		? resolve(`/account/${encodeURIComponent(addressResolved)}`)
		: undefined}
	data-link={isLinked
		? 'camouflaged'
		: undefined}
	source="address"
	data-text={isVertical
		? 'vertical'
		: undefined}
>
	<span data-row="inline">
		{#if showAvatar}
			{@const net = networkResolved != null ? networksByChainId[networkResolved.chainId] : undefined}
			<Icon
				shape={!profile?.avatarUrl
					? IconShape.Square
					: IconShape.Circle}
				src={profile?.avatarUrl ?? blo(addressResolved)}
				subicon={net?.icon
					? {
						src: net.icon,
						shape: IconShape.Circle,
						backgroundColor: net.color,
					}
					: undefined}
			/>
		{/if}

		<span data-text="font-monospace">
			<TruncatedValue
				value={addressResolved}
				startLength={format === AddressFormat.Full
					? addressResolved.length
					: 6}
				endLength={format === AddressFormat.Full
					? 0
					: 4}
			/>
		</span>

		<small>
			{#if ensName}
				(<span data-text="font-monospace">{ensName}</span>)
			{/if}
		</small>
	</span>
</EntityId>
{/if}
