<script lang="ts">
	// Types/constants
	import type { RoomPeerRow } from '$/collections/PartykitRoomPeers.ts'
	import type { SiweChallengeRow } from '$/collections/SiweChallenges.ts'
	import type { VerificationRow } from '$/collections/SiweVerifications.ts'
	import type { EIP1193Provider } from '$/lib/rooms/siwe.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { VerificationStatus } from '$/data/Verification.ts'
	import { sharedAddressesCollection } from '$/collections/SharedAddresses.ts'
	import { siweChallengesCollection } from '$/collections/SiweChallenges.ts'
	import { siweVerificationsCollection } from '$/collections/SiweVerifications.ts'
	import { signSiweMessage } from '$/lib/rooms/siwe.ts'
	import { roomState } from '$/state/room.svelte.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Props
	let {
		peer,
		roomId,
		provider,
	}: {
		peer: RoomPeerRow
		roomId: string
		provider: EIP1193Provider | null
	} = $props()


	// Context
	const sharedQuery = useLiveQuery(
		(q) =>
			q
				.from({ sharedAddress: sharedAddressesCollection })
				.where(
					({ sharedAddress }) =>
						eq(sharedAddress.roomId, roomId) && eq(sharedAddress.peerId, peer.peerId),
				)
				.select(({ sharedAddress }) => ({ sharedAddress })),
		[() => roomId, () => peer.peerId],
	)
	const challengesQuery = useLiveQuery(
		(q) =>
			q
				.from({ siweChallenge: siweChallengesCollection })
				.where(({ siweChallenge }) => eq(siweChallenge.roomId, roomId))
				.select(({ siweChallenge }) => ({ siweChallenge })),
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
	registerLocalLiveQueryStack(() => [
		{ id: 'peer-card-shared', label: 'Shared Addresses', query: sharedQuery },
		{ id: 'peer-card-siwe', label: 'SIWE Challenges', query: challengesQuery },
		{
			id: 'peer-card-verifications',
			label: 'Verifications',
			query: verificationsQuery,
		},
	])


	// (Derived)
	const allShared = $derived((sharedQuery.data ?? []).map(({ row: sharedAddress }) => sharedAddress))
	const addressesVisibleToMe = $derived(
		allShared.filter(
			(s) =>
				s.targetPeerIds === null
				|| (roomState.peerId != null && s.targetPeerIds.includes(roomState.peerId)),
		),
	)
	const verifications = $derived(
		(verificationsQuery.data ?? []).map(({ verification }) => verification),
	)
	const awaitingMySignature = $derived(
		(challengesQuery.data ?? [])
			.map(({ siweChallenge }) => siweChallenge)
			.filter(
				(ch: SiweChallengeRow) =>
					ch.toPeerId === peer.peerId &&
					ch.fromPeerId === roomState.peerId &&
					!ch.signature,
			),
	)
	const canSign = $derived(provider != null)


	// Functions
	const getMyVerification = (
		address: `0x${string}`,
	): VerificationRow | undefined =>
		roomState.peerId == null ?
			undefined
		: (
			[...verifications]
				.filter(
					(v) =>
						v.verifierPeerId === roomState.peerId
						&& v.verifiedPeerId === peer.peerId
						&& v.address.toLowerCase() === address.toLowerCase(),
				)
				.sort((a, b) => b.requestedAt - a.requestedAt)[0]
		)


	// Actions
	const signChallenge = async (challenge: SiweChallengeRow) => {
		if (!provider) return
		try {
			const signature = await signSiweMessage({
				provider,
				message: challenge.message,
				address: challenge.address,
			})
			roomState.connection?.send({
				type: 'submit-signature',
				challengeId: challenge.id,
				signature,
			})
		} catch {
			// user rejected or error
		}
	}
	const markUnverifiable = (challengeId: string) => {
		roomState.connection?.send({ type: 'mark-unverifiable', challengeId })
	}
	const requestVerification = (address: `0x${string}`) => {
		if (roomState.peerId == null) return
		roomState.connection?.send({
			type: 'request-challenge',
			address,
			fromPeerId: roomState.peerId,
		})
	}


	// Components
	import { Button } from 'bits-ui'
	import Address from '$/views/Address.svelte'
	import Peer from './Peer.svelte'
</script>


<article
	data-peer-card
	data-connected={peer.isConnected}
>
	<div data-row="gap-4 align-start">
		<div
			data-row="flexible"
			data-card
			data-row-item="flexible"
		>
			<Peer
				peer={peer}
				showStatus={true}
			/>
		</div>
		<div
			data-row="flexible"
			data-card
			data-row-item="flexible"
		>
			{#if addressesVisibleToMe.length > 0}
				<ul data-peer-addresses>
					{#each addressesVisibleToMe as s (s.id)}
						{@const myVerification = getMyVerification(s.address)}
						<li
							data-shared-address
							data-verification-status={myVerification?.status ?? null}
						>
							<Address
								actorId={{ $network: { chainId: 1 }, address: s.address }}
							/>
							<span data-verification>
								{#if myVerification == null}
									Not verified
									<Button.Root
										type="button"
										onclick={() => requestVerification(s.address)}
									>
										Request verification
									</Button.Root>
								{:else if myVerification.status === 'unverifiable'}
									Unverifiable
									<Button.Root
										type="button"
										onclick={() => requestVerification(s.address)}
									>
										Re-verify
									</Button.Root>
								{:else if myVerification.status === VerificationStatus.Verifying}
									Verifying
								{:else}
									Verified
									{#if myVerification.verifiedAt != null}
										<time
											datetime={new Date(myVerification.verifiedAt).toISOString()}
										>
											{new Date(myVerification.verifiedAt).toLocaleString(
												undefined,
												{ dateStyle: 'short', timeStyle: 'short' },
											)}
										</time>
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
			{:else}
				<p data-no-addresses>No addresses shared yet.</p>
			{/if}
			{#if awaitingMySignature.length > 0}
				<section data-awaiting-signature>
					<h4>Awaiting your signature</h4>
					<ul>
						{#each awaitingMySignature as ch (ch.id)}
							<li data-challenge>
								<Address
									actorId={{ $network: { chainId: 1 }, address: ch.address }}
								/>
								{#if canSign}
									<Button.Root
										type="button"
										onclick={() => signChallenge(ch)}
									>
										Sign to verify
									</Button.Root>
								{:else}
									<span data-unverifiable>Unverifiable (read-only wallet)</span>
									<Button.Root
										type="button"
										onclick={() => markUnverifiable(ch.id)}
									>
										Mark unverifiable
									</Button.Root>
								{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>
	</div>
</article>

