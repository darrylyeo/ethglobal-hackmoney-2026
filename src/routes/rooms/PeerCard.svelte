<script lang="ts">


	// Types/constants
	import type { RoomPeerRow } from '$/collections/room-peers'
	import type { SiweChallengeRow } from '$/collections/siwe-challenges'
	import type { VerificationRow } from '$/collections/verifications'
	import type { EIP1193Provider } from '$/lib/siwe'
	import { DataSource } from '$/constants/data-sources'


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
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { sharedAddressesCollection } from '$/collections/shared-addresses'
	import { siweChallengesCollection } from '$/collections/siwe-challenges'
	import { verificationsCollection } from '$/collections/verifications'
	import { roomState } from '$/state/room.svelte'
	import { signSiweMessage } from '$/lib/siwe'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'


	// Components
	import Address from '$/components/Address.svelte'
	import Peer from './Peer.svelte'
	import { Button } from 'bits-ui'

	const sharedQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sharedAddressesCollection })
				.where(
					({ row }) =>
						eq(row.$source, DataSource.PartyKit) &&
						eq(row.roomId, roomId) &&
						eq(row.peerId, peer.peerId),
				)
				.select(({ row }) => ({ row })),
		[() => roomId, () => peer.peerId],
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
	const verificationsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: verificationsCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.where(({ row }) => eq(row.roomId, roomId))
				.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const liveQueryEntries = [
		{ id: 'peer-card-shared', label: 'Shared Addresses', query: sharedQuery },
		{ id: 'peer-card-siwe', label: 'SIWE Challenges', query: challengesQuery },
		{
			id: 'peer-card-verifications',
			label: 'Verifications',
			query: verificationsQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)

	const allShared = $derived((sharedQuery.data ?? []).map((r) => r.row))
	const addressesVisibleToMe = $derived(
		allShared.filter(
			(s) =>
				s.targetPeerIds === null ||
				(roomState.peerId != null &&
					s.targetPeerIds.includes(roomState.peerId)),
		),
	)
	const verifications = $derived(
		(verificationsQuery.data ?? []).map((r) => r.row),
	)
	const getMyVerification = (
		address: `0x${string}`,
	): VerificationRow | undefined =>
		roomState.peerId == null
			? undefined
			: [...verifications]
					.filter(
						(v) =>
							v.verifierPeerId === roomState.peerId &&
							v.verifiedPeerId === peer.peerId &&
							v.address.toLowerCase() === address.toLowerCase(),
					)
					.sort((a, b) => b.requestedAt - a.requestedAt)[0]
	const awaitingMySignature = $derived(
		(challengesQuery.data ?? [])
			.map((r) => r.row)
			.filter(
				(ch: SiweChallengeRow) =>
					ch.toPeerId === peer.peerId &&
					ch.fromPeerId === roomState.peerId &&
					!ch.signature,
			),
	)
	const canSign = $derived(provider != null)
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
</script>


<article
	data-peer-card
	data-card
	data-connected={peer.isConnected}
>
	<header data-peer-card-header data-row="wrap gap-2 align-center">
		<Peer {peer} showStatus={true} />
	</header>
	{#if addressesVisibleToMe.length > 0}
		<ul data-peer-addresses>
			{#each addressesVisibleToMe as s (s.id)}
				{@const myVerification = getMyVerification(s.address)}
				<li
					data-shared-address
					data-verification-status={myVerification?.status ?? null}
				>
					<Address network={1} address={s.address} />
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
						{:else if myVerification.status === 'verifying'}
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
						<Address network={1} address={ch.address} />
						{#if canSign}
							<Button.Root type="button" onclick={() => signChallenge(ch)}>
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
</article>
