<script lang="ts">
	// Types/constants
	import type { YellowChannelRow } from '$/collections/yellow-channels'
	import type { YellowChannelStateRow } from '$/collections/yellow-channel-states'
	import { DataSource } from '$/constants/data-sources'
	import type { ChannelStatus } from '$/data/YellowChannel'
	import type { EIP1193Provider } from '$/lib/wallet'

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { closeChannel, challengeChannel } from '$/api/yellow'
	import { liveQueryLocalAttachmentFrom } from '$/svelte/live-query-context.svelte'
	import { yellowChannelsCollection } from '$/collections/yellow-channels'
	import { yellowChannelStatesCollection } from '$/collections/yellow-channel-states'
	import { roomsCollection } from '$/collections/rooms'
	import { walletConnectionsCollection } from '$/collections/wallet-connections'
	import { walletsCollection } from '$/collections/wallets'
	import { formatSmallestToDecimal } from '$/lib/format'
	import { yellowState } from '$/state/yellow.svelte'
	import { roomIdToDisplayName } from '$/lib/room'

	const isEip1193Provider = (value: unknown): value is EIP1193Provider =>
		typeof value === 'object' &&
		value !== null &&
		'request' in value &&
		typeof value.request === 'function'

	// (Derived)
	const channelsQuery = useLiveQuery((q) =>
		q.from({ row: yellowChannelsCollection }).select(({ row }) => ({ row })),
	)
	const statesQuery = useLiveQuery((q) =>
		q
			.from({ row: yellowChannelStatesCollection })
			.select(({ row }) => ({ row })),
	)
	const roomsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: roomsCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.select(({ row }) => ({ row })),
		[],
	)
	const connectionsQuery = useLiveQuery((q) =>
		q
			.from({ row: walletConnectionsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)
	const walletsQuery = useLiveQuery((q) =>
		q
			.from({ row: walletsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)
	const liveQueryEntries = [
		{
			id: 'yellow-channels',
			label: 'Yellow Channels',
			query: channelsQuery,
		},
		{
			id: 'yellow-channel-states',
			label: 'Channel States',
			query: statesQuery,
		},
		{
			id: 'yellow-rooms',
			label: 'Rooms',
			query: roomsQuery,
		},
		{
			id: 'yellow-connections',
			label: 'Wallet Connections',
			query: connectionsQuery,
		},
		{
			id: 'yellow-wallets',
			label: 'Wallets',
			query: walletsQuery,
		},
	]
	const liveQueryAttachment = liveQueryLocalAttachmentFrom(
		() => liveQueryEntries,
	)
	const connections = $derived((connectionsQuery.data ?? []).map((r) => r.row))
	const wallets = $derived((walletsQuery.data ?? []).map((r) => r.row))
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
	const walletProvider = $derived(
		selectedWallet && isEip1193Provider(selectedWallet.provider)
			? selectedWallet.provider
			: null,
	)
	const allChannels = $derived((channelsQuery.data ?? []).map((r) => r.row))
	const channelStatesByChannelId = $derived(
		(statesQuery.data ?? []).reduce<Record<string, YellowChannelStateRow>>(
			(acc, { row }) => {
				const id = row.channelId
				const existing = acc[id]
				if (!existing || row.timestamp > existing.timestamp) acc[id] = row
				return acc
			},
			{},
		),
	)
	const roomsById = $derived(
		new Map((roomsQuery.data ?? []).map((r) => [r.row.id, r.row])),
	)
	const myAddress = $derived(yellowState.address?.toLowerCase() ?? null)

	// State
	type StatusFilter =
		| 'all'
		| 'active'
		| 'closing'
		| 'dispute'
		| 'final'
		| 'initial'
	type OriginFilter = 'all' | 'room' | 'external'
	let statusFilter = $state<StatusFilter>('all')
	let originFilter = $state<OriginFilter>('all')
	let myChannelsOnly = $state(true)
	let closingChannelId = $state<string | null>(null)
	let challengeChannelId = $state<string | null>(null)
	let actionError = $state<string | null>(null)

	// (Derived) filtered list
	const statusMatches = (status: ChannelStatus) =>
		statusFilter === 'all' ||
		(statusFilter === 'active' && status === 'active') ||
		(statusFilter === 'closing' && status === 'closing') ||
		(statusFilter === 'dispute' && status === 'disputed') ||
		(statusFilter === 'final' && status === 'closed') ||
		(statusFilter === 'initial' && status === 'pending')
	const filteredChannels = $derived(
		allChannels.filter((ch) => {
			if (!statusMatches(ch.status)) return false
			if (originFilter === 'room' && !ch.roomId) return false
			if (originFilter === 'external' && ch.roomId) return false
			if (myChannelsOnly && myAddress) {
				const isMine =
					ch.participant0.toLowerCase() === myAddress ||
					ch.participant1.toLowerCase() === myAddress
				if (!isMine) return false
			}
			return true
		}),
	)
	const totalChannels = $derived(allChannels.length)
	const activeChannels = $derived(
		allChannels.filter((ch) => ch.status === 'active').length,
	)
	const roomChannelsCount = $derived(
		allChannels.filter((ch) => ch.roomId != null).length,
	)

	// Functions
	const shortId = (id: string) =>
		id.length > 14 ? `${id.slice(0, 6)}…${id.slice(-6)}` : id
	const getCounterparty = (ch: YellowChannelRow) =>
		myAddress && ch.participant0.toLowerCase() === myAddress
			? ch.participant1
			: ch.participant0
	const getMyBalance = (ch: YellowChannelRow) =>
		myAddress && ch.participant0.toLowerCase() === myAddress
			? ch.balance0
			: ch.balance1
	const getCounterpartyBalance = (ch: YellowChannelRow) =>
		myAddress && ch.participant0.toLowerCase() === myAddress
			? ch.balance1
			: ch.balance0
	const isParticipant = (ch: YellowChannelRow) =>
		myAddress &&
		(ch.participant0.toLowerCase() === myAddress ||
			ch.participant1.toLowerCase() === myAddress)
	const roomDisplay = (roomId: string) =>
		roomsById.get(roomId)?.name ?? roomIdToDisplayName(roomId)

	// Actions
	const handleClose = async (ch: YellowChannelRow) => {
		if (!yellowState.clearnodeConnection || !yellowState.address) {
			actionError = 'Connect to Yellow before closing'
			return
		}
		closingChannelId = ch.id
		actionError = null
		try {
			await closeChannel({
				clearnodeConnection: yellowState.clearnodeConnection,
				channelId: ch.id as `0x${string}`,
				fundsDestination: yellowState.address,
			})
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Close failed'
		} finally {
			closingChannelId = null
		}
	}
	const handleChallenge = async (ch: YellowChannelRow) => {
		const latestState = channelStatesByChannelId[ch.id]
		if (!latestState) {
			actionError = 'No state available to challenge'
			return
		}
		if (!walletProvider) {
			actionError = 'Connect a wallet to challenge'
			return
		}
		challengeChannelId = ch.id
		actionError = null
		try {
			await challengeChannel({
				provider: walletProvider,
				channelId: ch.id,
				latestState: {
					id: latestState.id,
					channelId: latestState.channelId,
					intent: latestState.intent,
					version: latestState.version,
					stateData: latestState.stateData,
					allocations: latestState.allocations,
					signatures: latestState.signatures,
					isFinal: latestState.isFinal,
					timestamp: latestState.timestamp,
				},
			})
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Challenge failed'
		} finally {
			challengeChannelId = null
		}
	}

	// Components
	import Address from '$/components/Address.svelte'
	import { Button } from 'bits-ui'
	import TransferDialog from '$/routes/rooms/TransferDialog.svelte'

	let transferOpen = $state(false)
	let transferChannel = $state<YellowChannelRow | null>(null)
</script>

<svelte:head>
	<title>Yellow Channels</title>
</svelte:head>

<div style="display: contents" {@attach liveQueryAttachment}>
	<main id="main" data-column data-sticky-container>
		<h1>Yellow Channels</h1>

		<section class="summary" data-row="gap-4">
			<p>Total: {totalChannels}</p>
			<p>Active: {activeChannels}</p>
			<p>With room: {roomChannelsCount}</p>
		</section>

		<section class="filters" data-row="gap-4" data-wrap>
			<label data-row="gap-1">
				<span>Status</span>
				<select bind:value={statusFilter}>
					<option value="all">all</option>
					<option value="initial">initial</option>
					<option value="active">active</option>
					<option value="closing">closing</option>
					<option value="dispute">dispute</option>
					<option value="final">final</option>
				</select>
			</label>
			<label data-row="gap-1">
				<span>Origin</span>
				<select bind:value={originFilter}>
					<option value="all">all</option>
					<option value="room">room</option>
					<option value="external">external</option>
				</select>
			</label>
			<label data-row="gap-1">
				<input type="checkbox" bind:checked={myChannelsOnly} />
				My channels only
			</label>
		</section>

		{#if actionError}
			<p class="action-error" role="alert">{actionError}</p>
		{/if}

		<section class="channel-list">
			<table>
				<thead>
					<tr>
						<th>Channel</th>
						<th>Participants</th>
						<th>My balance</th>
						<th>Counterparty</th>
						<th>Status</th>
						<th>Room</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredChannels as ch (ch.id)}
						{@const counterparty = getCounterparty(ch)}
						{@const myBal = getMyBalance(ch)}
						{@const otherBal = getCounterpartyBalance(ch)}
						{@const participant = isParticipant(ch)}
						<tr data-status={ch.status}>
							<td>{shortId(ch.id)}</td>
							<td>
								<Address network={ch.chainId} address={ch.participant0} />
								–
								<Address network={ch.chainId} address={ch.participant1} />
							</td>
							<td>{formatSmallestToDecimal(myBal, 6)} USDC</td>
							<td>{formatSmallestToDecimal(otherBal, 6)} USDC</td>
							<td data-status>{ch.status}</td>
							<td>
								{#if ch.roomId}
									<span class="room-badge" data-room
										>{roomDisplay(ch.roomId)}</span
									>
									<a href="/rooms/{ch.roomId}/channels">View room</a>
								{:else}
									—
								{/if}
							</td>
							<td data-row="gap-1">
								{#if ch.status === 'active' && participant}
									<Button.Root
										type="button"
										onclick={() => {
											transferChannel = ch
											transferOpen = true
										}}
									>
										Send
									</Button.Root>
								{/if}
								{#if ch.status === 'active' && participant}
									<Button.Root
										type="button"
										disabled={closingChannelId === ch.id}
										onclick={() => handleClose(ch)}
									>
										{closingChannelId === ch.id ? 'Closing…' : 'Close'}
									</Button.Root>
								{/if}
								{#if (ch.status === 'active' || ch.status === 'closing') && participant}
									<Button.Root
										type="button"
										disabled={challengeChannelId === ch.id ||
											!channelStatesByChannelId[ch.id]}
										onclick={() => handleChallenge(ch)}
									>
										{challengeChannelId === ch.id
											? 'Challenging…'
											: 'Challenge'}
									</Button.Root>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if filteredChannels.length === 0}
				<p>No channels match the filters.</p>
			{/if}
		</section>
	</main>

	{#if transferChannel}
		<TransferDialog channel={transferChannel} bind:open={transferOpen} />
	{/if}
</div>

<style>
	.summary p {
		margin: 0;
	}
	.filters select {
		min-width: 6rem;
	}
	.action-error {
		color: var(--color-error, red);
	}
	.channel-list {
		overflow-x: auto;
	}
	.channel-list table {
		width: 100%;
		border-collapse: collapse;
	}
	.channel-list th,
	.channel-list td {
		padding: 0.25rem 0.5rem;
		text-align: left;
		border: 1px solid var(--color-border, #ccc);
	}
	.channel-list td[data-row] {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.room-badge {
		display: inline-block;
		padding: 0.1rem 0.3rem;
		border-radius: 0.2rem;
		background: var(--color-surface-2, #eee);
		margin-right: 0.25rem;
	}
</style>
