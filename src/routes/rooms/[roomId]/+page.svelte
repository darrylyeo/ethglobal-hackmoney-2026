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

	// Components
	import PeerList from '../PeerList.svelte'
	import AddressSharing from '../AddressSharing.svelte'
	import SharedAddresses from '../SharedAddresses.svelte'

	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let selectedChainId = $state<number | null>(null)

	const roomId = $derived(data.roomId)
	const selectedWallet = $derived(connectedWallets.find((w) => w.connection.selected) ?? null)
	const provider = $derived(selectedWallet?.wallet.provider ?? null)

	$effect(() => {
		const id = roomId
		if (!id) return
		if (untrack(() => roomState.roomId) !== id) {
			joinRoom(id, getOrCreatePeerDisplayName())
		}
		return () => leaveRoom()
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
				/>
			</header>
		</summary>

		<div data-column="gap-6">
			<PeerList {roomId} />
			<AddressSharing
				{roomId}
				addresses={selectedWallet?.connection.actors ?? []}
				{provider}
			/>
			<SharedAddresses {roomId} />
		</div>
	</details>
</main>
