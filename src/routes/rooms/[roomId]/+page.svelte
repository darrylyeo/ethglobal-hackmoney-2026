<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { WalletConnectionTransport } from '$/data/WalletConnection.ts'


	// Context
	import { page } from '$app/state'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { resolve } from '$app/paths'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import EntityView from '$/components/EntityView.svelte'
	import { partykitRoomPeersCollection } from '$/collections/PartykitRoomPeers.ts'
	import {
		roomState,
		joinRoom,
		leaveRoom,
		partyKitStatusLabel,
	} from '$/state/room.svelte.ts'


	// (Derived)
	const roomId = $derived(page.params.roomId ?? '')


	// Functions
	import {
		getOrCreatePeerDisplayName,
		roomIdToDisplayName,
		roomIdToPlaceEmoji,
	} from '$/lib/rooms/room.ts'
	import { untrack } from 'svelte'


	// State
	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let selectedChainId = $state<number | null>(null)
	let leaveToken = 0


	// (Derived)
	const peersQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: partykitRoomPeersCollection })
				.where(({ row }) => eq(row.roomId, roomId))
				.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const liveQueryEntries = [
		{
			id: 'room-peers',
			label: 'Room Peers',
			query: peersQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const others = $derived(
		(peersQuery.data ?? [])
			.map((r) => r.row)
			.filter((p) => p.peerId !== roomState.peerId),
	)
	const selectedWallets = $derived(
		connectedWallets.filter((w) => w.connection.selected),
	)
	const isEip1193Wallet = (
		wallet: ConnectedWallet,
	): wallet is Extract<
		ConnectedWallet,
		{ connection: { transport: WalletConnectionTransport.Eip1193 } }
	> => wallet.connection.transport === WalletConnectionTransport.Eip1193
	const provider = $derived(
		selectedWallets.find(isEip1193Wallet)?.wallet.provider ?? null,
	)
	const roomDisplayName = $derived(roomIdToDisplayName(roomId))
	const roomPlaceEmoji = $derived(roomIdToPlaceEmoji(roomId))
	const connectionStatusLabel = $derived(
		partyKitStatusLabel(roomState.connectionStatus),
	)
	const roomShareUrl = $derived(
		typeof globalThis !== 'undefined' &&
			'location' in globalThis &&
			globalThis.location
			? `${globalThis.location.origin}${resolve(`/rooms/${roomId}`)}`
			: resolve(`/rooms/${roomId}`),
	)


	// Actions
	$effect(() => {
		document.title = roomDisplayName
	})
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


	// Components
	import AccountsSelect from '$/views/AccountsSelect.svelte'
	import PendingSignatures from '../PendingSignatures.svelte'
	import Peer from '../Peer.svelte'
	import PeerCard from '../PeerCard.svelte'
</script>


<main
	id="main"
	data-column
	data-sticky-container
>
	<EntityView
		data-scroll-item
		entityType={EntityType.Room}
		entity={{
			id: roomId,
			createdAt: 0,
			createdBy: '',
			name: roomDisplayName,
			connectionStatusLabel,
			connectionStatus: roomState.connectionStatus,
		}}
		idSerialized={roomId}
		href={resolve(`/rooms/${roomId}`)}
		label={roomDisplayName}
	>
		{#snippet AfterTitle({ entity })}
			{#if entity?.connectionStatusLabel}
				<span
					data-tag
					data-connection-status={entity.connectionStatus}
				>
					{entity.connectionStatusLabel}
				</span>
			{/if}
		{/snippet}
		{#snippet Title()}
			<span class="room-place-emoji" aria-hidden="true">{roomPlaceEmoji}</span>
			{roomDisplayName}
		{/snippet}
		<nav data-row="gap-2 align-center wrap">
			<a
				data-button
				href={resolve(`/rooms/${roomId}`)}
				title={roomShareUrl}
			>
				Room link
			</a>
			<a
				data-button
				href={resolve(`/rooms/${roomId}/channels`)}
			>
				Channels
			</a>
			<a
				data-button
				href={resolve('/rooms')}
				onclick={() => leaveRoom()}
			>
				Leave room
			</a>
		</nav>
		<section data-scroll-item>
		<details
			open
			data-card
		>
			<summary>
				<header
					data-card
					data-row="wrap gap-2"
				>
					<AccountsSelect
						bind:connectedWallets
						bind:selectedActor
						bind:selectedChainId
						selectionMode="multiple"
					/>
				</header>
			</summary>

			<div
				data-column="gap-6"
				data-room-structure
			>
				<section data-me>
					<h2>Me</h2>
					{#if roomState.peerId}
						{@const me = {
							id: `${roomId}:${roomState.peerId}`,
							roomId,
							peerId: roomState.peerId,
							displayName: getOrCreatePeerDisplayName(),
							joinedAt: 0,
							lastSeenAt: 0,
							connectedAt: 0,
							isConnected: true,
						}}
						<div data-card>
							<Peer peer={me} />
						</div>
					{:else}
						<p>Connecting…</p>
					{/if}
				</section>

				<PendingSignatures {roomId} {provider} />

				<section data-peers>
					<h2>Peers</h2>
					{#if others.length === 0}
						<p>No other peers in this room.</p>
					{:else}
						{@const connected = others.filter((p) => p.isConnected)}
						{@const disconnected = others.filter((p) => !p.isConnected)}
						{#if connected.length > 0}
							<ul data-peer-cards>
								{#each connected as peer (peer.id)}
									<li>
										<PeerCard {peer} {roomId} {provider} />
									</li>
								{/each}
							</ul>
						{/if}
						{#if disconnected.length > 0}
							<details data-disconnected-peers>
								<summary>Disconnected ({disconnected.length})</summary>
								<ul data-peer-cards>
									{#each disconnected as peer (peer.id)}
										<li>
											<PeerCard {peer} {roomId} {provider} />
										</li>
									{/each}
								</ul>
							</details>
						{/if}
					{/if}
				</section>
			</div>
		</details>
	</section>
	</EntityView>
</main>


<style>
	.room-place-emoji {
		font-size: 1.25em;
		line-height: 1;
	}
</style>
