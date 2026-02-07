<script lang="ts">


	// Context
	import { resolve } from '$app/paths'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { DataSource } from '$/constants/data-sources.ts'
	import { myPeerIdsCollection } from '$/collections/my-peer-ids.ts'
	import { roomPeersCollection } from '$/collections/room-peers.ts'
	import { verificationsCollection } from '$/collections/verifications.ts'
	import { formatAddress } from '$/lib/address.ts'
	import { forgetPeer } from '$/state/room.svelte.ts'


	// (Derived)
	const verificationsQuery = useLiveQuery(
		(q) =>
			q.from({ row: verificationsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const roomPeersQuery = useLiveQuery(
		(q) => q.from({ row: roomPeersCollection }).select(({ row }) => ({ row })),
		[],
	)
	const myPeerIdsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: myPeerIdsCollection })
				.where(({ row }) => eq(row.$source, DataSource.Local))
				.select(({ row }) => ({ row })),
		[],
	)
	const myPeerIdsSet = $derived(
		new Set((myPeerIdsQuery.data ?? []).map((r) => r.row.peerId)),
	)
	const verifiedByMeVerifications = $derived(
		(verificationsQuery.data ?? []).filter(
			(r) =>
				myPeerIdsSet.has(r.row.verifierPeerId) && r.row.status === 'verified',
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
	const handleForget = (peerId: string) => {
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
	id="main"
	data-sticky-container
	data-column
>
	<h1>Peers</h1>

	<p>Verified accounts (addresses you have verified in a room).</p>

	<ul
		data-column="gap-2"
		data-card
	>
		{#each peersList as entry (entry.peerId + entry.address)}
			<li
				data-row="gap-2"
				data-list-row
			>
				<a href={resolve(`/account/${encodeURIComponent(entry.address)}`)}>
					<span>{entry.displayName ?? formatAddress(entry.address)}</span>
					<span data-muted>{formatAddress(entry.address)}</span>
				</a>
				<span data-tag>{entry.isConnected ? 'Connected' : 'Disconnected'}</span>
				<span data-tag>Verified</span>
				{#if !entry.isConnected}
					<button
						type="button"
						onclick={() => handleForget(entry.peerId)}
						aria-label="Forget peer"
					>
						Forget
					</button>
				{/if}
			</li>
		{/each}
	</ul>

	{#if peersList.length === 0}
		<p data-muted>
			No verified peers. Verify an address in a room to see them here.
		</p>
	{/if}
</main>

