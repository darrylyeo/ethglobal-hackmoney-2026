<script lang="ts">
	// Props
	let { roomId }: { roomId: string } = $props()

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { roomPeersCollection } from '$/collections/room-peers'

	// Components
	import PeerAvatar from '$/components/PeerAvatar.svelte'
	import Timestamp from '$/components/Timestamp.svelte'
	import { TimestampFormat } from '$/components/Timestamp.svelte'

	const peersQuery = useLiveQuery(
		(q) => q
			.from({ row: roomPeersCollection })
			.where(({ row }) => eq(row.roomId, roomId))
			.select(({ row }) => ({ row })),
		[() => roomId],
	)

	const peers = $derived((peersQuery.data ?? []).map((r) => r.row))
</script>

<section data-peer-list>
	<h3>Peers</h3>
	<ul>
		{#each peers as peer (peer.id)}
			<li data-peer data-connected={peer.isConnected}>
				<PeerAvatar {peer} />
				<span>{peer.displayName ?? peer.peerId.slice(0, 8)}</span>
				<span data-status>{peer.isConnected ? '●' : '○'}</span>
				{#if peer.isConnected && peer.connectedAt != null}
					<small title="Connected">
						since <Timestamp timestamp={peer.connectedAt} format={TimestampFormat.Relative} />
					</small>
				{:else if peer.disconnectedAt != null}
					<small title="Disconnected">
						left <Timestamp timestamp={peer.disconnectedAt} format={TimestampFormat.Relative} />
					</small>
				{/if}
			</li>
		{/each}
	</ul>
</section>
