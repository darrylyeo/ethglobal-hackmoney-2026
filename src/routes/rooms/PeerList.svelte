<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources'

	// Props
	let { roomId }: { roomId: string } = $props()

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { roomPeersCollection } from '$/collections/room-peers'
	import { liveQueryLocalAttachmentFrom } from '$/svelte/live-query-context.svelte'

	// Components
	import Peer from './Peer.svelte'

	const peersQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: roomPeersCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.where(({ row }) => eq(row.roomId, roomId))
				.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const liveQueryEntries = [
		{
			id: 'peer-list',
			label: 'Room Peers',
			query: peersQuery,
		},
	]
	const liveQueryAttachment = liveQueryLocalAttachmentFrom(
		() => liveQueryEntries,
	)

	const peers = $derived((peersQuery.data ?? []).map((r) => r.row))
</script>

<section data-peer-list {@attach liveQueryAttachment}>
		<h3>Peers</h3>
		<ul>
			{#each peers as peer (peer.id)}
				<li data-peer data-connected={peer.isConnected}>
					<Peer {peer} showStatus={true} />
				</li>
			{/each}
		</ul>
	</section>
