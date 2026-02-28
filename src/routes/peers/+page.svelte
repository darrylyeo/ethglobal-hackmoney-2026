<script lang="ts">
	// Context
	import { resolve } from '$app/paths'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { myPeerIdsCollection } from '$/collections/MyPeerIds.ts'
	import { partykitRoomPeersCollection } from '$/collections/PartykitRoomPeers.ts'
	import { siweVerificationsCollection } from '$/collections/SiweVerifications.ts'
	import { VerificationStatus } from '$/data/Verification.ts'
	import { formatAddress } from '$/lib/address.ts'
	import { forgetPeer } from '$/state/room.svelte.ts'

	// (Derived)
	const verificationsQuery = useLiveQuery(
		(q) =>
			q.from({ row: siweVerificationsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const roomPeersQuery = useLiveQuery(
		(q) => q.from({ row: partykitRoomPeersCollection }).select(({ row }) => ({ row })),
		[],
	)
	const myPeerIdsQuery = useLiveQuery(
		(q) =>
			q.from({ row: myPeerIdsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const myPeerIdsSet = $derived(
		new Set((myPeerIdsQuery.data ?? []).map(({ row: peer }) => peer.peerId)),
	)
	const verifiedByMeVerifications = $derived(
		(verificationsQuery.data ?? []).filter(
			(r) =>
				myPeerIdsSet.has(r.row.verifierPeerId) && r.row.status === VerificationStatus.Verified,
		),
	)
	const peerIdToRoomPeers = $derived(
		(roomPeersQuery.data ?? []).reduce((acc, { row }) => {
			const list = acc.get(row.peerId) ?? []
			list.push(row)
			acc.set(row.peerId, list)
			return acc
		}, new Map<string, { displayName?: string; isConnected: boolean; peerId: string }[]>()),
	)
	const peersList = $derived(
		verifiedByMeVerifications
			.filter((v) => peerIdToRoomPeers.has(v.row.verifiedPeerId))
			.map((v) => {
				const peers = peerIdToRoomPeers.get(v.row.verifiedPeerId)!
				const roomPeer = peers[0]
				return {
					address: v.row.address,
					peerId: v.row.verifiedPeerId,
					displayName: roomPeer.displayName,
					isConnected: peers.some((p) => p.isConnected),
				}
			}),
	)
	const peersByPeerId = $derived(
		peersList.reduce((acc, p) => {
			const list = acc.get(p.peerId) ?? []
			list.push(p)
			acc.set(p.peerId, list)
			return acc
		}, new Map<string, { address: `0x${string}`; displayName?: string; isConnected: boolean }[]>()),
	)


	// Actions
	const onForget = (peerId: string) => {
		if (
			!peersByPeerId.get(peerId)?.every((p) => !p.isConnected) ||
			!confirm(
				'Remove this peer from your list? They will reappear if you meet again in a room.',
			)
		)
			return
		forgetPeer(peerId)
	}
</script>


<svelte:head>
	<title>Peers</title>
</svelte:head>


<main
	data-sticky-container
	data-column
>
	<h1>Peers</h1>

	<p>Verified accounts (addresses you have verified in a room).</p>

	<ul
		data-column
		data-card
	>
		{#each peersList as entry (entry.peerId + entry.address)}
			<li
				data-row
				data-list-row
			>
				<a href={resolve(`/account/${encodeURIComponent(entry.address)}`)}>
					<span>{entry.displayName ?? formatAddress(entry.address)}</span>
					<span data-text="muted">{formatAddress(entry.address)}</span>
				</a>
				<span data-tag>{entry.isConnected ? 'Connected' : 'Disconnected'}</span>
				<span data-tag>Verified</span>
				{#if !entry.isConnected}
					<button
						type="button"
						onclick={() => onForget(entry.peerId)}
						aria-label="Forget peer"
					>
						Forget
					</button>
				{/if}
			</li>
		{/each}
	</ul>

	{#if peersList.length === 0}
		<p data-text="muted">
			No verified peers. Verify an address in a room to see them here.
		</p>
	{/if}
</main>

