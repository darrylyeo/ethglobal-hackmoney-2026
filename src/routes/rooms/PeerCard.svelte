<script lang="ts">
	// Types/constants
	import type { RoomPeer } from '$/collections/room-peers'
	import type { EIP1193Provider } from '$/lib/siwe'
	import type { SiweChallenge } from '$/collections/siwe-challenges'

	// Props
	let {
		peer,
		roomId,
		provider,
	}: {
		peer: RoomPeer
		roomId: string
		provider: EIP1193Provider | null
	} = $props()

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { sharedAddressesCollection } from '$/collections/shared-addresses'
	import { siweChallengesCollection } from '$/collections/siwe-challenges'
	import { roomState } from '$/state/room.svelte'
	import { signSiweMessage } from '$/lib/siwe'

	// Components
	import Address from '$/components/Address.svelte'
	import Peer from '$/components/Peer.svelte'
	import { Button } from 'bits-ui'

	const sharedQuery = useLiveQuery(
		(q) => q
			.from({ row: sharedAddressesCollection })
			.where(({ row }) => eq(row.roomId, roomId) && eq(row.peerId, peer.peerId))
			.select(({ row }) => ({ row })),
		[() => roomId, () => peer.peerId],
	)
	const challengesQuery = useLiveQuery(
		(q) => q
			.from({ row: siweChallengesCollection })
			.where(({ row }) => eq(row.roomId, roomId))
			.select(({ row }) => ({ row })),
		[() => roomId],
	)

	const addresses = $derived((sharedQuery.data ?? []).map((r) => r.row))
	const awaitingMySignature = $derived(
		(challengesQuery.data ?? [])
			.map((r) => r.row)
			.filter(
				(ch: SiweChallenge) =>
					ch.toPeerId === peer.peerId &&
					ch.fromPeerId === roomState.peerId &&
					!ch.signature,
			),
	)
	const signChallenge = async (challenge: SiweChallenge) => {
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
</script>

<article data-peer-card data-card="secondary" data-connected={peer.isConnected}>
	<header data-peer-card-header data-row="wrap gap-2 align-center">
		<Peer {peer} showStatus={true} />
	</header>
	{#if addresses.length > 0}
		<ul data-peer-addresses>
			{#each addresses as s (s.id)}
				{@const verifiedByMe = roomState.peerId != null && s.verifiedBy.includes(roomState.peerId)}
				<li
					data-shared-address
					data-verified-by-me={verifiedByMe}
				>
					<Address network={1} address={s.address} />
					<span data-verification>
						{verifiedByMe ? 'Verified by you' : 'Not verified by you'}
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
						<Button.Root
							type="button"
							onclick={() => signChallenge(ch)}
							disabled={!provider}
						>
							Sign to verify
						</Button.Root>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</article>
