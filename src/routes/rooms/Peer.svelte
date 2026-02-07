<script lang="ts">


	// Types/constants
	import type { RoomPeer } from '$/collections/room-peers.ts'
	import { peerNameToEmoji, peerNameToHue } from '$/lib/rooms/room.ts'


	// Props
	let {
		peer,
		showStatus = false,
	}: {
		peer: RoomPeer,
		showStatus?: boolean,
	} = $props()


	// (Derived)
	const name = $derived(peer.displayName ?? peer.peerId.slice(0, 8))
	const hue = $derived(peerNameToHue(peer.displayName ?? peer.peerId))
	const emoji = $derived(peerNameToEmoji(peer.displayName, peer.peerId))
	const bg = $derived(`oklch(0.65 0.2 ${hue})`)


	// Components
	import Timestamp from '$/components/Timestamp.svelte'
	import { TimestampFormat } from '$/components/Timestamp.svelte'
</script>


<span data-row="wrap gap-2 align-center">
	<span
		class="peer-avatar-wrap"
		data-connected={showStatus ? peer.isConnected : undefined}
	>
		<span
			class="peer-avatar"
			data-row="center"
			role="img"
			aria-hidden="true"
			style="background: {bg};"
		>
			{emoji}
		</span>
		{#if showStatus}
			<span
				class="peer-avatar-dot"
				aria-hidden="true"
			/>
		{/if}
	</span>
	<span data-peer-name>{name}</span>
	{#if showStatus}
		<span data-tag={peer.isConnected ? 'Connected' : 'Disconnected'}>
			{peer.isConnected ? 'Connected' : 'Disconnected'}
		</span>
		{#if peer.isConnected && peer.connectedAt != null}
			<small>
				since <Timestamp
					timestamp={peer.connectedAt}
					format={TimestampFormat.Relative}
				/>
			</small>
		{:else if peer.disconnectedAt != null}
			<small>
				left <Timestamp
					timestamp={peer.disconnectedAt}
					format={TimestampFormat.Relative}
				/>
			</small>
		{/if}
	{/if}
</span>


<style>
	.peer-avatar-wrap {
		position: relative;
		flex-shrink: 0;
	}

	.peer-avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		font-size: 1rem;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.peer-avatar-dot {
		position: absolute;
		inset-block-end: 0;
		inset-inline-end: 0;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		border: 2px solid var(--color-bg);
		background: var(--color-fg-muted);
	}

	.peer-avatar-wrap[data-connected='true'] > .peer-avatar-dot {
		background: var(--color-success, oklch(0.6 0.2 145));
	}

	.peer-avatar-wrap[data-connected='false'] > .peer-avatar-dot {
		background: var(--color-fg-muted);
	}
</style>
