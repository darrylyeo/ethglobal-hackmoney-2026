<script lang="ts">
	// Types/constants
	import type { RoomPeer } from '$/collections/room-peers'

	// Props
	let {
		peer,
		roomId,
		peerCount,
	}: {
		peer: RoomPeer
		roomId: string
		peerCount: number
	} = $props()

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { sharedAddressesCollection } from '$/collections/shared-addresses'

	// Components
	import Address from '$/components/Address.svelte'
	import PeerAvatar from '$/components/PeerAvatar.svelte'
	import Timestamp from '$/components/Timestamp.svelte'
	import { TimestampFormat } from '$/components/Timestamp.svelte'

	const sharedQuery = useLiveQuery(
		(q) => q
			.from({ row: sharedAddressesCollection })
			.where(({ row }) => eq(row.roomId, roomId) && eq(row.peerId, peer.peerId))
			.select(({ row }) => ({ row })),
		[() => roomId, () => peer.peerId],
	)

	const addresses = $derived((sharedQuery.data ?? []).map((r) => r.row))
	const displayName = $derived(peer.displayName ?? peer.peerId.slice(0, 8))
</script>

<article data-peer-card data-card="secondary" data-connected={peer.isConnected}>
	<header data-peer-card-header data-row="wrap gap-2 align-center">
		<PeerAvatar {peer} />
		<div data-peer-card-meta>
			<span data-peer-name>{displayName}</span>
			<span data-status>{peer.isConnected ? '●' : '○'}</span>
			{#if peer.isConnected && peer.connectedAt != null}
				<small>since <Timestamp timestamp={peer.connectedAt} format={TimestampFormat.Relative} /></small>
			{:else if peer.disconnectedAt != null}
				<small>left <Timestamp timestamp={peer.disconnectedAt} format={TimestampFormat.Relative} /></small>
			{/if}
		</div>
	</header>
	{#if addresses.length > 0}
		<ul data-peer-addresses>
			{#each addresses as s (s.id)}
				{@const verificationCount = s.verifiedBy.length}
				<li
					data-shared-address
					data-fully-verified={peerCount > 0 && verificationCount === peerCount}
				>
					<Address network={1} address={s.address} />
					<span data-verification>
						{verificationCount}/{peerCount} verified
					</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p data-no-addresses>No addresses shared yet.</p>
	{/if}
</article>
