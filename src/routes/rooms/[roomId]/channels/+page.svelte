<script lang="ts">
	// Props
	let { data }: { data: { roomId: string } } = $props()

	// State
	import { getOrCreatePeerDisplayName } from '$/lib/partykit'
	import { roomState, joinRoom, leaveRoom } from '$/state/room.svelte'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { walletsCollection } from '$/collections/wallets'
	import { walletConnectionsCollection } from '$/collections/wallet-connections'
	import { untrack } from 'svelte'

	const roomId = $derived(data.roomId)

	const walletsQuery = useLiveQuery((q) => q.from({ row: walletsCollection }).select(({ row }) => ({ row })))
	const connectionsQuery = useLiveQuery((q) => q.from({ row: walletConnectionsCollection }).select(({ row }) => ({ row })))

	const wallets = $derived((walletsQuery.data ?? []).map((r) => r.row))
	const connections = $derived((connectionsQuery.data ?? []).map((r) => r.row))
	const selectedConnection = $derived(connections.find((c) => c.selected) ?? null)
	const selectedWallet = $derived(
		selectedConnection
			? wallets.find((w) => w.$id.rdns === selectedConnection.$id.wallet$id.rdns)
			: null,
	)
	const provider = $derived(selectedWallet?.provider ?? null)

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
	import ChannelProposals from '../../ChannelProposals.svelte'
	import DepositManager from '../../DepositManager.svelte'
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
		<ChannelProposals {roomId} />
		<ChannelList {roomId} />
	</section>
</main>
