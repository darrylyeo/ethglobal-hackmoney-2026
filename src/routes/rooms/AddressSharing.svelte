<script lang="ts">
	// Types/constants
	import type { RoomPeerRow } from '$/collections/room-peers'
	import type { SiweChallengeRow } from '$/collections/siwe-challenges'
	import type { EIP1193Provider } from '$/lib/siwe'
	import { DataSource } from '$/constants/data-sources'

	// Props
	let {
		roomId,
		addresses,
		provider,
		peers,
	}: {
		roomId: string
		addresses: `0x${string}`[]
		provider: EIP1193Provider | null
		peers: RoomPeerRow[]
	} = $props()

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { sharedAddressesCollection } from '$/collections/shared-addresses'
	import { siweChallengesCollection } from '$/collections/siwe-challenges'
	import { roomState } from '$/state/room.svelte'
	import { signSiweMessage } from '$/lib/siwe'
	import { liveQueryLocalAttachmentFrom } from '$/svelte/live-query-context.svelte'

	const mySharedQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sharedAddressesCollection })
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
		{ id: 'address-sharing', label: 'Shared Addresses', query: mySharedQuery },
		{
			id: 'address-sharing-challenges',
			label: 'SIWE Challenges',
			query: challengesQuery,
		},
	]
	const liveQueryAttachment = liveQueryLocalAttachmentFrom(
		() => liveQueryEntries,
	)

	const myShared = $derived(
		(mySharedQuery.data ?? [])
			.map((r) => r.row)
			.filter((s) => s.peerId === roomState.peerId),
	)
	const pendingChallenges = $derived(
		(challengesQuery.data ?? [])
			.map((r) => r.row)
			.filter(
				(ch: SiweChallengeRow) =>
					ch.toPeerId === roomState.peerId && !ch.verified && !ch.signature,
			),
	)

	const canSign = $derived(provider != null)
	const isSharedWithAll = (addr: `0x${string}`) =>
		myShared.some(
			(s) =>
				s.address.toLowerCase() === addr.toLowerCase() &&
				s.targetPeerIds === null,
		)
	const isSharedWithPeer = (addr: `0x${string}`, peerId: string) =>
		myShared.some(
			(s) =>
				s.address.toLowerCase() === addr.toLowerCase() &&
				s.targetPeerIds !== null &&
				s.targetPeerIds.includes(peerId),
		)
	const shareWithAll = (address: `0x${string}`) => {
		roomState.connection?.send({ type: 'share-address', address })
	}
	const shareWithPeer = (address: `0x${string}`, targetPeerId: string) => {
		roomState.connection?.send({
			type: 'share-address',
			address,
			targetPeerIds: [targetPeerId],
		})
	}
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

	// Components
	import Address from '$/components/Address.svelte'
	import { Button } from 'bits-ui'
</script>

<section data-my-addresses {@attach liveQueryAttachment}>
	<h3>My addresses</h3>
	{#if addresses.length === 0}
		<p>Connect a wallet to share addresses.</p>
	{:else}
		<ul>
			{#each addresses as address (address)}
				{@const sharedWithAll = isSharedWithAll(address)}
				<li data-address>
					<Address network={1} {address} />
					<div data-row="wrap gap-2">
						<Button.Root
							type="button"
							onclick={() => shareWithAll(address)}
							disabled={sharedWithAll}
						>
							{sharedWithAll ? 'Shared with all' : 'Share with all'}
						</Button.Root>
						{#each peers as peer (peer.id)}
							{@const sharedWithThis = isSharedWithPeer(address, peer.peerId)}
							<Button.Root
								type="button"
								onclick={() => shareWithPeer(address, peer.peerId)}
								disabled={sharedWithThis}
							>
								{sharedWithThis
									? `Shared (${peer.displayName ?? peer.peerId.slice(0, 8)})`
									: `Share (${peer.displayName ?? peer.peerId.slice(0, 8)})`}
							</Button.Root>
						{/each}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

{#if pendingChallenges.length > 0}
	<section data-pending-signatures>
		<h3>Pending signatures</h3>
		<ul>
			{#each pendingChallenges as ch (ch.id)}
				<li data-challenge>
					<Address network={1} address={ch.address} />
					<span>Requested by {ch.fromPeerId.slice(0, 8)}</span>
					{#if canSign}
						<Button.Root type="button" onclick={() => signChallenge(ch)}>
							Sign
						</Button.Root>
					{:else}
						<span data-unverifiable>Unverifiable (read-only wallet)</span>
						<Button.Root type="button" onclick={() => markUnverifiable(ch.id)}>
							Mark unverifiable
						</Button.Root>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}
