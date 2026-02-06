<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources'
	import { WalletConnectionTransport } from '$/data/WalletConnection'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { ercTokens } from '$/constants/coins'
	import { networksByChainId } from '$/constants/networks'
	import { fetchAllBalancesForAddress } from '$/collections/actor-coins'
	import { roomPeersCollection } from '$/collections/room-peers'
	import { roomsCollection } from '$/collections/rooms'
	import { sharedAddressesCollection } from '$/collections/shared-addresses'
	import { transactionsCollection } from '$/collections/transactions'
	import { verificationsCollection } from '$/collections/verifications'
	import { walletConnectionsCollection } from '$/collections/wallet-connections'
	import { walletsCollection } from '$/collections/wallets'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'


	// Props
	let { data }: { data: { addressParam: string } } = $props()


	// Functions
	import { formatAddress, parseAccountAddressParam } from '$/lib/address'
	import { formatSmallestToDecimal } from '$/lib/format'
	import { getAddressUrl } from '$/constants/explorers'


	// (Derived)
	const parsed = $derived(parseAccountAddressParam(data.addressParam))
	const normalizedAddress = $derived(parsed?.address ?? null)


	// State
	const balanceTokens = $derived(
		ercTokens.map((t) => ({ chainId: t.chainId, tokenAddress: t.address })),
	)
	$effect(() => {
		if (!normalizedAddress) return
		void fetchAllBalancesForAddress(normalizedAddress, undefined, ercTokens)
	})
	const transactionsQuery = useLiveQuery(
		(q) =>
			q.from({ row: transactionsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const connectionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: walletConnectionsCollection })
				.where(({ row }) => eq(row.$source, DataSource.Local))
				.select(({ row }) => ({ row })),
		[],
	)
	const walletsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: walletsCollection })
				.where(({ row }) => eq(row.$source, DataSource.Local))
				.select(({ row }) => ({ row })),
		[],
	)
	const sharedAddressesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sharedAddressesCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.select(({ row }) => ({ row })),
		[],
	)
	const roomsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: roomsCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.select(({ row }) => ({ row })),
		[],
	)
	const roomPeersQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: roomPeersCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.select(({ row }) => ({ row })),
		[],
	)
	const verificationsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: verificationsCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.select(({ row }) => ({ row })),
		[],
	)
	const liveQueryEntries = [
		{
			id: 'account-transactions',
			label: 'Transactions',
			query: transactionsQuery,
		},
		{
			id: 'account-connections',
			label: 'Wallet Connections',
			query: connectionsQuery,
		},
		{ id: 'account-wallets', label: 'Wallets', query: walletsQuery },
		{
			id: 'account-shared-addresses',
			label: 'Shared Addresses',
			query: sharedAddressesQuery,
		},
		{ id: 'account-rooms', label: 'Rooms', query: roomsQuery },
		{ id: 'account-room-peers', label: 'Room Peers', query: roomPeersQuery },
		{
			id: 'account-verifications',
			label: 'Verifications',
			query: verificationsQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const transactions = $derived(
		normalizedAddress
			? (transactionsQuery.data ?? [])
					.map((r) => r.row)
					.filter(
						(row) =>
							row.$id.address.toLowerCase() === normalizedAddress.toLowerCase(),
					)
					.sort((a, b) => b.$id.createdAt - a.$id.createdAt)
			: [],
	)
	const walletsByRdns = $derived(
		new Map((walletsQuery.data ?? []).map((r) => [r.row.$id.rdns, r.row])),
	)
	const connectionsForAccount = $derived(
		normalizedAddress
			? (connectionsQuery.data ?? [])
					.map((r) => r.row)
					.filter((c) =>
						c.actors.some(
							(a) => a.toLowerCase() === normalizedAddress.toLowerCase(),
						),
					)
			: [],
	)
	const sharedRowsForAccount = $derived(
		normalizedAddress
			? (sharedAddressesQuery.data ?? [])
					.map((r) => r.row)
					.filter(
						(row) =>
							row.address.toLowerCase() === normalizedAddress.toLowerCase(),
					)
			: [],
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
	const verificationsList = $derived(
		(verificationsQuery.data ?? []).map((r) => r.row),
	)
	const getVerificationStatus = (roomId: string, peerId: string) =>
		verificationsList.find(
			(v) =>
				v.roomId === roomId &&
				v.verifiedPeerId === peerId &&
				normalizedAddress != null &&
				v.address.toLowerCase() === normalizedAddress.toLowerCase(),
		)?.status ?? null


	// Components
	import EvmActor from '$/components/EvmActor.svelte'
	import CoinBalances from '$/views/CoinBalances.svelte'
</script>


<svelte:head>
	<title>
		{parsed ? `Account ${formatAddress(parsed.address)}` : 'Account'}
	</title>
</svelte:head>


<div data-column="gap-2">
	{#if !parsed}
		<h1>Invalid address</h1>
		<p>The address in the URL could not be parsed.</p>
	{:else}
		<header data-column="gap-2">
			<h1>Account</h1>
			<EvmActor
				network={parsed.chainId ?? 1}
				address={parsed.address}
			/>
			<div data-row="wrap gap-2" class="account-address" data-account-header>
				{#if parsed.interopAddress}
					<code class="interop">{parsed.interopAddress}</code>
				{/if}
				<code class="raw" title={parsed.address}>{parsed.address}</code>
				<button
					type="button"
					class="copy-btn"
					title="Copy address"
					onclick={() => {
						navigator.clipboard.writeText(parsed.address)
					}}
				>
					Copy
				</button>
				{#if parsed.chainId}
					{@const explorerUrl = getAddressUrl(parsed.chainId, parsed.address)}
					{#if explorerUrl}
						<a
							href={explorerUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="explorer-link"
						>
							View on explorer
						</a>
					{/if}
				{/if}
			</div>
		</header>

		<section data-column="gap-2" class="account-section">
			<h2>Balances</h2>
			<CoinBalances selectedActor={normalizedAddress} {balanceTokens} />
		</section>

		<section data-column="gap-2" class="account-section">
			<h2>Transactions</h2>
			{#if transactions.length === 0}
				<p data-muted>No indexed transactions for this account.</p>
			{:else}
				<ul data-column="gap-2" data-list="unstyled" class="tx-list">
					{#each transactions as tx (tx.$id.sourceTxHash + tx.$id.createdAt)}
						{@const fromNet = networksByChainId[tx.fromChainId]}
						{@const toNet = networksByChainId[tx.toChainId]}
						<li class="tx-item" data-card="padding-2 radius-4" data-tag={tx.status} data-row="gap-3 align-center">
							<span class="tx-chains">
								{fromNet?.name ?? tx.fromChainId} → {toNet?.name ??
									tx.toChainId}
							</span>
							<span class="tx-amount" data-row-item="flexible">
								{formatSmallestToDecimal(tx.fromAmount, 6, 2)} →
								{formatSmallestToDecimal(tx.toAmount, 6, 2)}
							</span>
							<span class="tx-status">{tx.status}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		{#if connectionsForAccount.length > 0}
			<section data-column="gap-2" class="account-section">
				<h2>Wallet connections</h2>
				<ul data-column="gap-2" data-list="unstyled" class="connections-list">
					{#each connectionsForAccount as conn (conn.$id.wallet$id.rdns)}
						{@const wallet =
							conn.transport === WalletConnectionTransport.None
								? null
								: walletsByRdns.get(conn.$id.wallet$id.rdns)}
						<li
							class="connection-item"
							data-card="padding-2 radius-4"
							data-tag={conn.status}
							data-row="gap-3 align-center"
						>
							<span
								class="connection-name"
								data-row-item="flexible"
							>
								{conn.transport === WalletConnectionTransport.None
									? 'Watching'
									: (wallet?.name ?? conn.$id.wallet$id.rdns)}
							</span>
							<span class="connection-status">{conn.status}</span>
							{#if conn.selected}
								<span class="connection-badge">Selected</span>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}
		{#if sharedRowsForAccount.length > 0}
			<section data-column="gap-2" class="account-section">
				<h2>Room / peer connections</h2>
				<ul data-column="gap-2" data-list="unstyled" class="connections-list">
					{#each sharedRowsForAccount as s (s.id)}
						{@const room = roomsById.get(s.roomId)}
						{@const peer = peersByRoomAndPeer.get(`${s.roomId}:${s.peerId}`)}
						{@const verificationStatus = getVerificationStatus(
							s.roomId,
							s.peerId,
						)}
						<li class="connection-item" data-card="padding-2 radius-4" data-row="gap-3 align-center">
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
			</section>
		{/if}
	{/if}
</div>


<style>
	.account-address {
		font-size: 0.9em;
	}

	.account-address code {
		font-family: ui-monospace, monospace;
		word-break: break-all;
	}

	.account-address code.raw {
		opacity: 0.85;
	}

	.copy-btn,
	.explorer-link {
		font-size: 0.85em;
		padding: 0.2rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-subtle);
		color: inherit;
		text-decoration: none;
		cursor: pointer;
	}

	.copy-btn:hover,
	.explorer-link:hover {
		background: var(--color-border);
	}

	.account-section h2 {
		font-size: 1rem;
		margin: 0;
	}

	.tx-chains,
	.connection-name {
		font-weight: 500;
	}

	.connection-name[href] {
		color: inherit;
		text-decoration: none;
	}

	.connection-name[href]:hover {
		text-decoration: underline;
	}

	.tx-status,
	.connection-status {
		font-size: 0.85em;
		opacity: 0.8;
	}

	.connection-badge {
		font-size: 0.75em;
		opacity: 0.9;
	}
</style>
