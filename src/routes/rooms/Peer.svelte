<script lang="ts">
	// Types/constants
	import type { RoomPeer } from '$/data/RoomPeer.ts'
	import { peerNameToEmoji } from '$/lib/rooms/room.ts'


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
	const emoji = $derived(peerNameToEmoji(peer.displayName, peer.peerId))


	// Components
	import Avatar from '$/components/Avatar.svelte'
	import Timestamp from '$/components/Timestamp.svelte'
	import { TimestampFormat } from '$/components/Timestamp.svelte'
</script>


<span data-row="wrap align-center">
	<span
		class="peer-avatar-wrap"
		data-connected={showStatus ? peer.isConnected : undefined}
	>
		<Avatar {name} {emoji} />
		{#if showStatus}
			<span
				class="peer-avatar-dot"
				aria-hidden="true"
			></span>
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
