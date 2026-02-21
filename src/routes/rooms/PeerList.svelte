<script lang="ts">
	// Types/constants
	import { partykitRoomPeersCollection } from '$/collections/PartykitRoomPeers.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Props
	let {
		roomId,
	}: {
		roomId: string
	} = $props()


	// Context
	const peersQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: partykitRoomPeersCollection })
				.where(({ row }) => eq(row.roomId, roomId))
				.select(({ row }) => ({ row })),
		[() => roomId],
	)
	registerLocalLiveQueryStack(() => [
		{
			id: 'peer-list',
			label: 'Room Peers',
			query: peersQuery,
		},
	])


	// (Derived)
	const peers = $derived((peersQuery.data ?? []).map((r) => r.row))


	// Components
	import Peer from './Peer.svelte'
</script>


<section data-peer-list>
	<h3>Peers</h3>
	<ul>
		{#each peers as peer (peer.id)}
			<li
				data-peer
				data-connected={peer.isConnected}
			>
				<Peer
					{peer}
					showStatus={true}
				/>
			</li>
		{/each}
	</ul>
</section>
