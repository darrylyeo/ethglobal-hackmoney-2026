<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import { untrack } from 'svelte'

	// Props
	let { data }: { data: { roomId: string } } = $props()

	// State
	import { getOrCreatePeerDisplayName } from '$/lib/partykit'
	import { roomState, joinRoom, leaveRoom } from '$/state/room.svelte'
	import Wallets from '$/routes/bridge/Wallets.svelte'

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { roomPeersCollection } from '$/collections/room-peers'

	// Components
	import AddressSharing from '../AddressSharing.svelte'
	import PeerAvatar from '$/components/PeerAvatar.svelte'
	import PeerCard from '../PeerCard.svelte'
	import Timestamp from '$/components/Timestamp.svelte'
	import { TimestampFormat } from '$/components/Timestamp.svelte'

	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let selectedChainId = $state<number | null>(null)

	const roomId = $derived(data.roomId)
	const selectedWallets = $derived(connectedWallets.filter((w) => w.connection.selected))
	const selectedAddresses = $derived(
		[...new Set(selectedWallets.flatMap((w) => w.connection.actors ?? []))]
	)
	const provider = $derived(selectedWallets[0]?.wallet.provider ?? null)

	const peersQuery = useLiveQuery(
		(q) => q
			.from({ row: roomPeersCollection })
			.where(({ row }) => eq(row.roomId, roomId))
			.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const peers = $derived((peersQuery.data ?? []).map((r) => r.row))
	const me = $derived(peers.find((p) => p.peerId === roomState.peerId))
	const others = $derived(peers.filter((p) => p.peerId !== roomState.peerId))
	const connectedOthers = $derived(others.filter((p) => p.isConnected))
	const disconnectedOthers = $derived(others.filter((p) => !p.isConnected))
	const verifierCount = $derived(Math.max(0, peers.length - 1))

	let leaveToken = 0
	$effect(() => {
		leaveToken++
		const id = roomId
		if (!id) return
		if (untrack(() => roomState.roomId) !== id) {
			joinRoom(id, getOrCreatePeerDisplayName())
		}
		const tokenAtCleanup = leaveToken
		return () => {
			queueMicrotask(() => {
				if (leaveToken === tokenAtCleanup) leaveRoom()
			})
		}
	})
</script>

<svelte:head>
	<title>Room {roomId}</title>
</svelte:head>

<main id="main-content">
	<h1>Room {roomId}</h1>

	<p>
		<a href="/rooms/{roomId}/channels">Channels</a>
		·
		<a
			href="/rooms"
			onclick={() => {
				leaveRoom()
			}}
		>
			Leave room
		</a>
	</p>

	<details open data-card>
		<summary>
			<header data-card="secondary" data-row="wrap gap-2">
				<Wallets
					bind:connectedWallets
					bind:selectedActor
					bind:selectedChainId
					selectionMode="multiple"
				/>
			</header>
		</summary>

		<div data-column="gap-6" data-room-structure>
			<section data-me data-card="secondary">
				<h2>Me</h2>
				{#if me}
					<header data-row="wrap gap-2 align-center">
						<PeerAvatar peer={me} />
						<div data-column="gap-0">
							<span data-peer-name>{me.displayName ?? me.peerId.slice(0, 8)}</span>
							<span data-status>{me.isConnected ? '●' : '○'}</span>
							{#if me.isConnected && me.connectedAt != null}
								<small>since <Timestamp timestamp={me.connectedAt} format={TimestampFormat.Relative} /></small>
							{:else if me.disconnectedAt != null}
								<small>left <Timestamp timestamp={me.disconnectedAt} format={TimestampFormat.Relative} /></small>
							{/if}
						</div>
					</header>
					<AddressSharing
						{roomId}
						addresses={selectedAddresses}
						{provider}
					/>
				{:else}
					<p>Connecting…</p>
				{/if}
			</section>

			<section data-peers>
				<h2>Peers</h2>
				{#if others.length === 0}
					<p>No other peers in this room.</p>
				{:else}
					{#if connectedOthers.length > 0}
						<ul data-peer-cards>
							{#each connectedOthers as peer (peer.id)}
								<li>
									<PeerCard {peer} {roomId} peerCount={verifierCount} />
								</li>
							{/each}
						</ul>
					{/if}
					{#if disconnectedOthers.length > 0}
						<details data-disconnected-peers>
							<summary>Disconnected ({disconnectedOthers.length})</summary>
							<ul data-peer-cards>
								{#each disconnectedOthers as peer (peer.id)}
									<li>
										<PeerCard {peer} {roomId} peerCount={verifierCount} />
									</li>
								{/each}
							</ul>
						</details>
					{/if}
				{/if}
			</section>
		</div>
	</details>
</main>
