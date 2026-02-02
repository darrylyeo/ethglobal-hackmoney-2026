<script lang="ts">
	// Types/constants
	import type { RoomPeer } from '$/collections/room-peers'
	import { peerNameToEmoji, peerNameToHue } from '$/lib/partykit'

	// Props
	let {
		peer,
		showStatus = false,
	}: {
		peer: RoomPeer
		showStatus?: boolean
	} = $props()

	// Components
	import Timestamp from '$/components/Timestamp.svelte'
	import { TimestampFormat } from '$/components/Timestamp.svelte'

	const name = $derived(peer.displayName ?? peer.peerId.slice(0, 8))
	const hue = $derived(peerNameToHue(peer.displayName ?? peer.peerId))
	const emoji = $derived(peerNameToEmoji(peer.displayName, peer.peerId))
	const bg = $derived(`oklch(0.65 0.2 ${hue})`)
</script>

<span data-peer data-row="wrap gap-2 align-center">
	<span
		data-peer-avatar
		role="img"
		aria-hidden="true"
		style="background: {bg};"
	>
		{emoji}
	</span>
	<span data-peer-name>{name}</span>
	{#if showStatus}
		<span data-status>{peer.isConnected ? '●' : '○'}</span>
		{#if peer.isConnected && peer.connectedAt != null}
			<small>since <Timestamp timestamp={peer.connectedAt} format={TimestampFormat.Relative} /></small>
		{:else if peer.disconnectedAt != null}
			<small>left <Timestamp timestamp={peer.disconnectedAt} format={TimestampFormat.Relative} /></small>
		{/if}
	{/if}
</span>

<style>
	[data-peer] {
		display: inline-flex;
	}
	[data-peer-avatar] {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		font-size: 1rem;
		line-height: 1;
		flex-shrink: 0;
	}
</style>
