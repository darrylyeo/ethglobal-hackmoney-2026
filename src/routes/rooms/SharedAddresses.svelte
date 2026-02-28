<script lang="ts">
	// Types/constants
	import type { SharedAddress } from '$/data/SharedAddress.ts'
	import { VerificationStatus } from '$/data/Verification.ts'
	import type { WithSource } from '$/constants/data-sources.ts'
	import type { Verification } from '$/data/Verification.ts'
	import { DataSourceId } from '$/constants/data-sources.ts'


	// Context
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { partykitRoomPeersCollection } from '$/collections/PartykitRoomPeers.ts'
	import { sharedAddressesCollection } from '$/collections/SharedAddresses.ts'
	import { siweChallengesCollection } from '$/collections/SiweChallenges.ts'
	import { siweVerificationsCollection } from '$/collections/SiweVerifications.ts'
	import { roomState } from '$/state/room.svelte.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Props
	let { roomId }: { roomId: string } = $props()


	// Functions
	import { getOrCreatePeerDisplayName } from '$/lib/rooms/room.ts'


	// State
	const sharedQuery = useLiveQuery(
		(q) =>
			q
				.from({ sharedAddress: sharedAddressesCollection })
				.where(({ sharedAddress }) => eq(sharedAddress.roomId, roomId))
				.select(({ sharedAddress }) => ({ sharedAddress })),
		[() => roomId],
	)
	const peersQuery = useLiveQuery(
		(q) =>
			q
				.from({ roomPeer: partykitRoomPeersCollection })
				.where(({ roomPeer }) => eq(roomPeer.roomId, roomId))
				.select(({ roomPeer }) => ({ roomPeer })),
		[() => roomId],
	)
	const verificationsQuery = useLiveQuery(
		(q) =>
			q
				.from({ verification: siweVerificationsCollection })
				.where(({ verification }) => eq(verification.roomId, roomId))
				.select(({ verification }) => ({ verification })),
		[() => roomId],
	)
	const challengesQuery = useLiveQuery(
		(q) =>
			q
				.from({ siweChallenge: siweChallengesCollection })
				.where(({ siweChallenge }) => eq(siweChallenge.roomId, roomId))
				.select(({ siweChallenge }) => ({ siweChallenge })),
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

	// (Derived)
	const sharedAddresses = $derived(
		(sharedQuery.data ?? []).map(({ sharedAddress }) => sharedAddress)
	)
	const sharedVisibleToMe = $derived(
		sharedAddresses.filter(
			(s) =>
				s.peerId !== roomState.peerId &&
				(s.targetPeerIds === null ||
					(roomState.peerId != null &&
						s.targetPeerIds.includes(roomState.peerId))),
		),
	)
	const peers = $derived(
		(peersQuery.data ?? []).map(({ roomPeer: peer }) => peer)
	)
	const verifications = $derived(
		(verificationsQuery.data ?? []).map(({ verification }) => verification),
	)
	const challenges = $derived(
		(challengesQuery.data ?? []).map(({ siweChallenge: challenge }) => challenge)
	)


	// Functions
	const getPeerName = (peerId: string) =>
		peerId === roomState.peerId
			? getOrCreatePeerDisplayName()
			: (peers.find((p) => p.peerId === peerId)?.displayName ??
				peerId.slice(0, 8))
	const getMyVerification = (s: SharedAddress): WithSource<Verification> | undefined =>
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
	): VerificationStatus | 'none' => {
		const v = getMyVerification(s)
		if (v) return v.status
		return hasPendingChallenge(s) ? VerificationStatus.Verifying : 'none'
	}
	const formatDate = (ts: number) =>
		new Date(ts).toLocaleString(undefined, {
			dateStyle: 'short',
			timeStyle: 'short',
		})


	// Actions
	const requestVerification = (address: `0x${string}`) => {
		if (roomState.peerId == null) return
		roomState.connection?.send({
			type: 'request-challenge',
			address,
			fromPeerId: roomState.peerId,
		})
	}


	// Components
	import Address from '$/views/Address.svelte'
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
				<li
					data-shared-address
					data-verification-status={status}
				>
					<span data-peer-name>{getPeerName(s.peerId)}</span>
					<Address
						actorId={{ $network: { chainId: 1 }, address: s.address }}
					/>
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
						{:else if status === VerificationStatus.Verifying}
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
								<span
									title={myVerification.signature}
									data-signature-tooltip
								>
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
