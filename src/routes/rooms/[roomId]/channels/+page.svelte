<script lang="ts">
	// Types/constants
	import type { EIP1193Provider } from '$/lib/wallet'

	// Context
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { walletConnectionsCollection } from '$/collections/wallet-connections'
	import { walletsCollection } from '$/collections/wallets'
	import { getOrCreatePeerDisplayName } from '$/lib/partykit'
	import { roomState, joinRoom, leaveRoom } from '$/state/room.svelte'
	import { untrack } from 'svelte'

	// Props
	let { data }: { data: { roomId: string } } = $props()

	// Functions
	const isEip1193Provider = (value: unknown): value is EIP1193Provider =>
		typeof value === 'object' &&
		value !== null &&
		'request' in value &&
		typeof value.request === 'function'

	// (Derived)
	const roomId = $derived(data.roomId)
	const walletsQuery = useLiveQuery((q) =>
		q.from({ row: walletsCollection }).select(({ row }) => ({ row })),
	)
	const connectionsQuery = useLiveQuery((q) =>
		q.from({ row: walletConnectionsCollection }).select(({ row }) => ({ row })),
	)
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
	<title>Channels – Room {roomId}</title>
</svelte:head>

<main id="main-content">
	<h1>Channels – Room {roomId}</h1>

	<p>
		<a href="/rooms/{roomId}">Back to room</a>
	</p>

	<section data-column="gap-6">
		<DepositManager {provider} />
		<TransferRequests {roomId} />
		<ChannelList {roomId} />
	</section>
</main>
