<script lang="ts">
	// Props
	let { roomId }: { roomId: string } = $props()

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { roomPeersCollection } from '$/collections/room-peers'

	// Components
	import Peer from '$/components/Peer.svelte'

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
				<Peer {peer} showStatus={true} />
			</li>
		{/each}
	</ul>
</section>
