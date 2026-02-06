<script lang="ts">
	// Types/constants
	import type { EIP1193Provider } from '$/lib/wallet'
	import { DataSource } from '$/constants/data-sources'


	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { resolve } from '$app/paths'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'
	import { walletConnectionsCollection } from '$/collections/wallet-connections'
	import { walletsCollection } from '$/collections/wallets'
	import {
		roomState,
		joinRoom,
		leaveRoom,
		partyKitStatusLabel,
	} from '$/state/room.svelte'


	// Props
	let { data }: { data: { roomId: string } } = $props()


	// Functions
	import { getOrCreatePeerDisplayName, roomIdToDisplayName } from '$/lib/room'
	import { untrack } from 'svelte'

	const isEip1193Provider = (value: unknown): value is EIP1193Provider =>
		typeof value === 'object' &&
		value !== null &&
		'request' in value &&
		typeof value.request === 'function'


	// (Derived)
	const roomId = $derived(data.roomId)
	const roomDisplayName = $derived(roomIdToDisplayName(roomId))
	const walletsQuery = useLiveQuery((q) =>
		q
			.from({ row: walletsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)
	const connectionsQuery = useLiveQuery((q) =>
		q
			.from({ row: walletConnectionsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)
	const liveQueryEntries = [
		{
			id: 'room-channels-wallets',
			label: 'Wallets',
			query: walletsQuery,
		},
		{
			id: 'room-channels-connections',
			label: 'Wallet Connections',
			query: connectionsQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const wallets = $derived((walletsQuery.data ?? []).map((r) => r.row))
	const connections = $derived((connectionsQuery.data ?? []).map((r) => r.row))
	const selectedConnection = $derived(
		connections.find((c) => c.selected) ?? null,
	)
	const selectedWallet = $derived(
		selectedConnection
			? wallets.find(
					(w) => w.$id.rdns === selectedConnection.$id.wallet$id.rdns,
				)
			: null,
	)
	const provider = $derived(
		selectedWallet && isEip1193Provider(selectedWallet.provider)
			? selectedWallet.provider
			: null,
	)

	$effect(() => {
		const id = roomId
		if (!id) return
		if (untrack(() => roomState.roomId) !== id) {
			joinRoom(id, getOrCreatePeerDisplayName())
		}
		return () => leaveRoom()
	})


	// Components
	import ChannelList from '../../ChannelList.svelte'
	import DepositManager from '../../DepositManager.svelte'
	import TransferRequests from '../../TransferRequests.svelte'
</script>


<svelte:head>
	<title>Channels – {roomDisplayName}</title>
</svelte:head>


<main id="main" data-column data-sticky-container>
	<h1>Channels – {roomDisplayName}</h1>

	<p data-row="wrap gap-2 align-center">
		<span
			data-partykit-status
			data-status={roomState.connectionStatus}
			title="PartyKit connection"
		>
			{partyKitStatusLabel(roomState.connectionStatus)}
		</span>
		<a href={resolve(`/rooms/${roomId}`)}>Back to room</a>
		·
		<a href="/channels/yellow">Yellow Channels</a>
	</p>

	<section data-column="gap-6">
		<DepositManager {provider} />
		<TransferRequests {roomId} />
		<ChannelList {roomId} />
	</section>
</main>
