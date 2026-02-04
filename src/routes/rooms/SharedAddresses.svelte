<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources'

	// Props
	let { roomId }: { roomId: string } = $props()

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { sharedAddressesCollection } from '$/collections/shared-addresses'
	import { roomPeersCollection } from '$/collections/room-peers'
	import { roomState } from '$/state/room.svelte'

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

	const shared = $derived((sharedQuery.data ?? []).map((r) => r.row))
	const peers = $derived((peersQuery.data ?? []).map((r) => r.row))
	const getPeerName = (peerId: string) =>
		peerId === roomState.peerId
			? getOrCreatePeerDisplayName()
			: (peers.find((p) => p.peerId === peerId)?.displayName ??
				peerId.slice(0, 8))

	// Components
	import Address from '$/components/Address.svelte'
</script>

<section data-shared-addresses>
	<h3>Shared addresses</h3>
	{#if shared.length === 0}
		<p>No shared addresses yet.</p>
	{:else}
		<ul>
			{#each shared as s (s.id)}
				{@const verifiedByMe =
					roomState.peerId != null && s.verifiedBy.includes(roomState.peerId)}
				<li data-shared-address data-verified-by-me={verifiedByMe}>
					<span data-peer-name>{getPeerName(s.peerId)}</span>
					<Address network={1} address={s.address} />
					<span data-verification>
						{verifiedByMe ? 'Verified by you' : 'Not verified by you'}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>
