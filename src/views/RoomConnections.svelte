<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources.ts'
	import { partykitRoomPeersCollection } from '$/collections/PartykitRoomPeers.ts'
	import { partykitRoomsCollection } from '$/collections/PartykitRooms.ts'
	import { sharedAddressesCollection } from '$/collections/SharedAddresses.ts'
	import { siweVerificationsCollection } from '$/collections/SiweVerifications.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Props
	let {
		selectedActor = null as `0x${string}` | null,
		filterAddresses = $bindable([] as `0x${string}`[]),
		availableAccounts = [],
	}: {
		selectedActor?: `0x${string}` | null
		filterAddresses?: `0x${string}`[]
		availableAccounts?: `0x${string}`[]
	} = $props()


	// Context
	const sharedAddressesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sharedAddressesCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	const roomsQuery = useLiveQuery(
		(q) =>
			q.from({ row: partykitRoomsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const roomPeersQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: partykitRoomPeersCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	const verificationsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: siweVerificationsCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	registerLocalLiveQueryStack(() => [
		{ id: 'shared-addresses', label: 'Shared Addresses', query: sharedAddressesQuery },
		{ id: 'rooms', label: 'Rooms', query: roomsQuery },
		{ id: 'room-peers', label: 'Room Peers', query: roomPeersQuery },
		{ id: 'verifications', label: 'Verifications', query: verificationsQuery },
	])


	// (Derived)
	const actors = $derived(
		filterAddresses.length > 0
			? filterAddresses
			: selectedActor
				? [selectedActor]
				: [],
	)
	const verificationsList = $derived(
		(verificationsQuery.data ?? []).map((r) => r.row),
	)
	const sharedRows = $derived(
		actors.length === 0
			? []
			: (sharedAddressesQuery.data ?? [])
					.map((r) => r.row)
					.filter((row) =>
						actors.some((a) => row.address === a),
					),
	)
	const roomsById = $derived(
		new Map((roomsQuery.data ?? []).map((r) => [r.row.id, r.row])),
	)
	const peersByRoomAndPeer = $derived(
		new Map(
			(roomPeersQuery.data ?? []).map((r) => [
				`${r.row.roomId}:${r.row.peerId}`,
				r.row,
			]),
		),
	)
	const singleAddress = $derived(actors.length === 1 ? actors[0] : null)


	// Functions
	const getVerificationStatus = (
		roomId: string,
		peerId: string,
		address: `0x${string}`,
	) =>
		verificationsList.find(
			(v) =>
				v.roomId === roomId &&
				v.verifiedPeerId === peerId &&
				v.address === address,
		)?.status ?? null


	// Components
	import Boundary from '$/components/Boundary.svelte'
	import ComboboxMultiple from '$/components/ComboboxMultiple.svelte'
	import TruncatedValue, {
		TruncatedValueFormat,
	} from '$/components/TruncatedValue.svelte'
</script>


	<details class="room-connections" data-card data-scroll-container="block" open>
		<summary class="section-summary">
			<div data-row="gap-2">
				<h3 data-row-item="flexible" class="section-heading">
					Room / peer connections{#if singleAddress}
						{' '}for <TruncatedValue
							value={singleAddress}
							startLength={6}
							endLength={4}
							format={TruncatedValueFormat.Abbr}
						/>
					{/if}
				</h3>
			</div>
			{#if availableAccounts.length > 0}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div
					class="section-filters"
					role="group"
					aria-label="Filters"
					data-row="gap-2 wrap"
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => e.stopPropagation()}
				>
					<ComboboxMultiple
						items={availableAccounts}
						bind:value={filterAddresses}
						placeholder="Account"
						ariaLabel="Filter by account"
						getItemId={(addr) => addr}
						getItemLabel={(addr) =>
							`${addr.slice(0, 6)}…${addr.slice(-4)}`}
					/>
				</div>
			{/if}
		</summary>
		<Boundary>
			{#if sharedRows.length === 0}
				<p data-text="muted">No room or peer connections for this account.</p>
			{:else}
				<ul
					data-columns="width-4 gap-2"
					data-list="unstyled"
					class="connections-list"
				>
					{#each sharedRows as s (s.id)}
						{@const room = roomsById.get(s.roomId)}
						{@const peer = peersByRoomAndPeer.get(`${s.roomId}:${s.peerId}`)}
						{@const verificationStatus = getVerificationStatus(
							s.roomId,
							s.peerId,
							s.address,
						)}
						<li
							class="connection-item"
							data-columns-item
							data-card="padding-2"
							data-row="gap-3"
						>
							<a
								href="/rooms/{s.roomId}"
								class="connection-name"
								data-row-item="flexible"
							>
								{room?.name ?? s.roomId}
							</a>
							<span class="connection-status">
								{peer?.displayName ?? s.peerId.slice(0, 8)}
							</span>
							{#if verificationStatus}
								<span
									class="connection-badge"
									data-verification={verificationStatus}
								>
									{verificationStatus}
								</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</Boundary>
	</details>


<style>
	.section-summary {
		list-style: none;
		cursor: pointer;
	}

	.section-summary::-webkit-details-marker {
		display: none;
	}

	.section-heading {
		font-size: 1rem;
		margin: 0;
	}

	.connection-name {
		font-weight: 500;
		color: inherit;
		text-decoration: none;
	}

	.connection-name:hover {
		text-decoration: underline;
	}

	.connection-status {
		font-size: 0.85em;
		opacity: 0.8;
	}

	.connection-badge {
		font-size: 0.75em;
		opacity: 0.9;
	}
</style>
