<script lang="ts">
	// Types/constants
	import type { RoomPeer } from '$/collections/room-peers'
	import { peerNameToEmoji, peerNameToHue } from '$/lib/partykit'

	// Props
	let { peer }: { peer: RoomPeer } = $props()

	const name = $derived(peer.displayName ?? peer.peerId)
	const hue = $derived(peerNameToHue(name))
	const emoji = $derived(peerNameToEmoji(peer.displayName, peer.peerId))
	const bg = $derived(`oklch(0.65 0.2 ${hue})`)
</script>

<span
	data-peer-avatar
	role="img"
	aria-label={name}
	style="background: {bg};"
>
	{emoji}
</span>

<style>
	[data-peer-avatar] {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		font-size: 1rem;
		line-height: 1;
	}
</style>
