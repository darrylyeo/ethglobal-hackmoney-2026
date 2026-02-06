<script lang="ts">


	// Types/constants
	import type { SharedAddress } from '$/data/SharedAddress'
	import type { VerificationRow } from '$/collections/verifications'
	import { DataSource } from '$/constants/data-sources'


	// Props
	let { roomId }: { roomId: string } = $props()


	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { sharedAddressesCollection } from '$/collections/shared-addresses'
	import { roomPeersCollection } from '$/collections/room-peers'
	import { siweChallengesCollection } from '$/collections/siwe-challenges'
	import { verificationsCollection } from '$/collections/verifications'
	import { roomState } from '$/state/room.svelte'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'


	// Functions
	import { getOrCreatePeerDisplayName } from '$/lib/room'

	const sharedQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sharedAddressesCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.where(({ row }) => eq(row.roomId, roomId))
				.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const peersQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: roomPeersCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.where(({ row }) => eq(row.roomId, roomId))
				.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const verificationsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: verificationsCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.where(({ row }) => eq(row.roomId, roomId))
				.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const challengesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: siweChallengesCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.where(({ row }) => eq(row.roomId, roomId))
				.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const liveQueryEntries = [
		{ id: 'shared-addresses', label: 'Shared Addresses', query: sharedQuery },
		{ id: 'shared-addresses-peers', label: 'Room Peers', query: peersQuery },
		{
			id: 'shared-addresses-verifications',
			label: 'Verifications',
			query: verificationsQuery,
		},
		{
			id: 'shared-addresses-challenges',
			label: 'SIWE Challenges',
			query: challengesQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)

	const sharedRows = $derived((sharedQuery.data ?? []).map((r) => r.row))
	const sharedVisibleToMe = $derived(
		sharedRows.filter(
			(s) =>
				s.peerId !== roomState.peerId &&
				(s.targetPeerIds === null ||
					(roomState.peerId != null &&
						s.targetPeerIds.includes(roomState.peerId))),
		),
	)
	const peers = $derived((peersQuery.data ?? []).map((r) => r.row))
	const verifications = $derived(
		(verificationsQuery.data ?? []).map((r) => r.row),
	)
	const challenges = $derived((challengesQuery.data ?? []).map((r) => r.row))
	const getPeerName = (peerId: string) =>
		peerId === roomState.peerId
			? getOrCreatePeerDisplayName()
			: (peers.find((p) => p.peerId === peerId)?.displayName ??
				peerId.slice(0, 8))
	const getMyVerification = (s: SharedAddress): VerificationRow | undefined =>
		roomState.peerId == null
			? undefined
			: [...verifications]
					.filter(
						(v) =>
							v.verifierPeerId === roomState.peerId &&
							v.verifiedPeerId === s.peerId &&
							v.address.toLowerCase() === s.address.toLowerCase(),
					)
					.sort((a, b) => b.requestedAt - a.requestedAt)[0]
	const hasPendingChallenge = (s: SharedAddress) =>
		roomState.peerId != null &&
		challenges.some(
			(c) =>
				c.fromPeerId === roomState.peerId &&
				c.toPeerId === s.peerId &&
				c.address.toLowerCase() === s.address.toLowerCase() &&
				!c.verified &&
				!c.signature,
		)
	const getStatus = (
		s: SharedAddress,
	): 'none' | 'unverifiable' | 'verifying' | 'verified' => {
		const v = getMyVerification(s)
		if (v) return v.status
		return hasPendingChallenge(s) ? 'verifying' : 'none'
	}
	const requestVerification = (address: `0x${string}`) => {
		if (roomState.peerId == null) return
		roomState.connection?.send({
			type: 'request-challenge',
			address,
			fromPeerId: roomState.peerId,
		})
	}
	const formatDate = (ts: number) =>
		new Date(ts).toLocaleString(undefined, {
			dateStyle: 'short',
			timeStyle: 'short',
		})


	// Components
	import Address from '$/components/Address.svelte'
	import { Button } from 'bits-ui'
</script>


<section data-shared-addresses>
	<h3>Shared addresses</h3>
	{#if sharedVisibleToMe.length === 0}
		<p>No shared addresses yet.</p>
	{:else}
		<ul>
			{#each sharedVisibleToMe as s (s.id)}
				{@const myVerification = getMyVerification(s)}
				{@const status = getStatus(s)}
				<li data-shared-address data-verification-status={status}>
					<span data-peer-name>{getPeerName(s.peerId)}</span>
					<Address network={1} address={s.address} />
					<span data-verification>
						{#if status === 'none'}
							—
							<Button.Root
								type="button"
								onclick={() => requestVerification(s.address)}
							>
								Request verification
							</Button.Root>
						{:else if status === 'unverifiable'}
							Unverifiable
							<Button.Root
								type="button"
								onclick={() => requestVerification(s.address)}
							>
								Re-verify
							</Button.Root>
						{:else if status === 'verifying'}
							Verifying
						{:else}
							Verified
							{#if myVerification?.verifiedAt != null}
								<time
									datetime={new Date(myVerification.verifiedAt).toISOString()}
								>
									{formatDate(myVerification.verifiedAt)}
								</time>
							{/if}
							{#if myVerification?.signature != null}
								<span title={myVerification.signature} data-signature-tooltip>
									(signature)
								</span>
							{/if}
							<Button.Root
								type="button"
								onclick={() => requestVerification(s.address)}
							>
								Re-verify
							</Button.Root>
						{/if}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>
