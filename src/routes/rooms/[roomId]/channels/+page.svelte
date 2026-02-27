<script lang="ts">
	// Types/constants
	import type { EIP1193Provider } from '$/lib/wallet.ts'
	import { DataSourceId } from '$/constants/data-sources.ts'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { walletsCollection } from '$/collections/Wallets.ts'
	import {
		roomState,
		joinRoom,
		leaveRoom,
		partyKitStatusLabel,
	} from '$/state/room.svelte.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'


	// (Derived)
	const roomId = $derived(page.params.roomId ?? '')
	const roomDisplayName = $derived(roomIdToDisplayName(roomId))


	// Functions
	import { getOrCreatePeerDisplayName, roomIdToDisplayName } from '$/lib/rooms/room.ts'
	import { untrack } from 'svelte'

	const isEip1193Provider = (value: unknown): value is EIP1193Provider =>
		typeof value === 'object' &&
		value !== null &&
		'request' in value &&
		typeof value.request === 'function'


	// State
	const walletsQuery = useLiveQuery((q) =>
		q.from({ row: walletsCollection }).select(({ row }) => ({ row })),
	)
	const connectionsQuery = useLiveQuery((q) =>
		q
			.from({ row: walletConnectionsCollection })
			.select(({ row }) => ({ row })),
	)


	// (Derived)
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
	const wallets = $derived((walletsQuery.data ?? []).map(({ row: wallet }) => wallet))
	const connections = $derived((connectionsQuery.data ?? []).map(({ row: connection }) => connection))
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


<main
	data-column
	data-sticky-container
>
	<h1>Channels – {roomDisplayName}</h1>

	<p data-row="wrap align-center">
		<span
			data-partykit-status
			data-status={roomState.connectionStatus}
			title="PartyKit connection"
		>
			{partyKitStatusLabel(roomState.connectionStatus)}
		</span>
		<a href={resolve(`/rooms/${roomId}`)}>Back to room</a>
		·
		<a href="/positions/channels">Channels</a>
	</p>

	<section data-column="gap-6">
		<DepositManager {provider} />
		<TransferRequests {roomId} />
		<ChannelList {roomId} />
	</section>
</main>
