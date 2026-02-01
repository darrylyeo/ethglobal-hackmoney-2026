<script lang="ts">
	// Props
	let { roomId }: { roomId: string } = $props()

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { sharedAddressesCollection } from '$/collections/shared-addresses'
	import { roomPeersCollection } from '$/collections/room-peers'

	const sharedQuery = useLiveQuery(
		(q) => q
			.from({ row: sharedAddressesCollection })
			.where(({ row }) => eq(row.roomId, roomId))
			.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const peersQuery = useLiveQuery(
		(q) => q
			.from({ row: roomPeersCollection })
			.where(({ row }) => eq(row.roomId, roomId))
			.select(({ row }) => ({ row })),
		[() => roomId],
	)

	const shared = $derived((sharedQuery.data ?? []).map((r) => r.row))
	const peers = $derived((peersQuery.data ?? []).map((r) => r.row))
	const peerCount = $derived(Math.max(0, peers.filter((p) => p.isConnected).length - 1))
	const getPeerName = (peerId: string) => (
		peers.find((p) => p.peerId === peerId)?.displayName ?? peerId.slice(0, 8)
	)

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
				{@const verificationCount = s.verifiedBy.length}
				<li
					data-shared-address
					data-fully-verified={peerCount > 0 && verificationCount === peerCount}
				>
					<span data-peer-name>{getPeerName(s.peerId)}</span>
					<Address network={1} address={s.address} />
					<span data-verification>
						{verificationCount}/{peerCount} verified
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>
