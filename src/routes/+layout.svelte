<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources'
	import { networkConfigs, toNetworkSlug } from '$/constants/networks'
	import { WalletConnectionTransport } from '$/data/WalletConnection'


	// Context
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { myPeerIdsCollection } from '$/collections/my-peer-ids'
	import { roomPeersCollection } from '$/collections/room-peers'
	import { roomsCollection } from '$/collections/rooms'
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'
	import { verificationsCollection } from '$/collections/verifications'
	import { walletConnectionsCollection } from '$/collections/wallet-connections'
	import { walletsCollection } from '$/collections/wallets'
	import {
		liveQueryAttachmentFrom,
		useLiveQueryContext,
		useLocalLiveQueryContext,
	} from '$/svelte/live-query-context.svelte'


	// Functions
	import { formatAddress } from '$/lib/address'
	import { roomIdToDisplayName } from '$/lib/room'
	import { buildSessionHash } from '$/lib/transaction-sessions'
	import { interopFormatConfig, toInteropName } from '$/constants/interop'

	const actionLabel = (action: string) =>
		action.length > 0
			? `${action[0].toUpperCase()}${action.slice(1)}`
			: 'Session'
	const sessionTitle = (session: { id: string; actions: string[] }) =>
		`${actionLabel(session.actions[0] ?? '')} ${session.id.slice(0, 6)}`
	const sessionHref = (session: { id: string; actions: string[] }) =>
		`/session${buildSessionHash(session.id)}`


	// Props
	let { children } = $props()


	// State
	let showGraph = $state(false)
	const globalLiveQueryCtx = useLiveQueryContext()
	const localLiveQueryCtx = useLocalLiveQueryContext()


	// (Derived)
	const roomsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: roomsCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.select(({ row }) => ({ row })),
		[],
	)
	const sessionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
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
	const walletConnectionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: walletConnectionsCollection })
				.where(({ row }) => eq(row.$source, DataSource.Local))
				.select(({ row }) => ({ row })),
		[],
	)
	const verificationsQuery = useLiveQuery(
		(q) =>
			q.from({ row: verificationsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const roomPeersQuery = useLiveQuery(
		(q) => q.from({ row: roomPeersCollection }).select(({ row }) => ({ row })),
		[],
	)
	const myPeerIdsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: myPeerIdsCollection })
				.where(({ row }) => eq(row.$source, DataSource.Local))
				.select(({ row }) => ({ row })),
		[],
	)
	const layoutLiveQueryEntries = [
		{ id: 'layout-rooms', label: 'Rooms', query: roomsQuery },
		{ id: 'layout-sessions', label: 'Sessions', query: sessionsQuery },
		{ id: 'layout-wallets', label: 'Wallets', query: walletsQuery },
		{
			id: 'layout-wallet-connections',
			label: 'Wallet Connections',
			query: walletConnectionsQuery,
		},
		{
			id: 'layout-verifications',
			label: 'Verifications',
			query: verificationsQuery,
		},
		{ id: 'layout-room-peers', label: 'Room Peers', query: roomPeersQuery },
		{ id: 'layout-my-peer-ids', label: 'My Peer IDs', query: myPeerIdsQuery },
	]
	const liveQueryAttachment = liveQueryAttachmentFrom(
		() => layoutLiveQueryEntries,
	)
	const walletsByRdns = $derived(
		new Map(
			(walletsQuery.data ?? []).map((result) => [
				result.row.$id.rdns,
				result.row,
			]),
		),
	)
	const connectedWalletConnections = $derived(
		(walletConnectionsQuery.data ?? [])
			.map((result) => result.row)
			.filter((row) => row.status === 'connected')
			.sort(
				(a, b) =>
					(a.transport === WalletConnectionTransport.None ? 1 : 0) -
					(b.transport === WalletConnectionTransport.None ? 1 : 0),
			),
	)
	const relevantChainIds = $derived(
		[
			...connectedWalletConnections
				.map((c) => c.chainId)
				.filter((id): id is number => id != null),
			...(sessionsQuery.data ?? []).flatMap((r) => {
				const row = r.row
				const ids: number[] = []
				if (typeof row.execution?.chainId === 'number')
					ids.push(row.execution.chainId)
				const p = row.params
				if (p && typeof p === 'object') {
					if (typeof (p as { chainId?: number }).chainId === 'number')
						ids.push((p as { chainId: number }).chainId)
					if (typeof (p as { fromChainId?: number }).fromChainId === 'number')
						ids.push((p as { fromChainId: number }).fromChainId)
					if (typeof (p as { toChainId?: number }).toChainId === 'number')
						ids.push((p as { toChainId: number }).toChainId)
				}
				return ids
			}),
		].filter((id) => Number.isSafeInteger(id) && id > 0),
	)
	const relevantNetworkConfigs = $derived(
		[...new Set(relevantChainIds)]
			.map((chainId) => networkConfigs.find((c) => c.chainId === chainId))
			.filter((c): c is NonNullable<typeof c> => c != null),
	)
	const myPeerIdsSet = $derived(
		new Set((myPeerIdsQuery.data ?? []).map((r) => r.row.peerId)),
	)
	const verifiedByMeVerifications = $derived(
		(verificationsQuery.data ?? []).filter(
			(r) =>
				myPeerIdsSet.has(r.row.verifierPeerId) && r.row.status === 'verified',
		),
	)
	const peerIdToRoomPeers = $derived(
		(roomPeersQuery.data ?? []).reduce((acc, { row }) => {
			const list = acc.get(row.peerId) ?? []
			list.push(row)
			acc.set(row.peerId, list)
			return acc
		}, new Map<string, { displayName?: string; isConnected: boolean }[]>()),
	)
	const peersNavItems = $derived(
		verifiedByMeVerifications
			.filter((v) => peerIdToRoomPeers.has(v.row.verifiedPeerId))
			.map((v) => {
				const peers = peerIdToRoomPeers.get(v.row.verifiedPeerId)!
				const roomPeer = peers[0]
				return {
					id: `peer-${v.row.verifiedPeerId}-${v.row.address}`,
					title: roomPeer.displayName ?? formatAddress(v.row.address),
					href: `/account/${encodeURIComponent(v.row.address)}`,
					tag: peers.some((p) => p.isConnected) ? 'Connected' : 'Disconnected',
				}
			}),
	)
	const accountNavItems = $derived(
		connectedWalletConnections.flatMap((connection) => {
			const rdns = connection.$id.wallet$id.rdns
			const wallet =
				connection.transport === WalletConnectionTransport.None
					? { name: 'Watching', rdns, icon: undefined as string | undefined }
					: (walletsByRdns.get(rdns) ?? {
							name: rdns,
							rdns,
							icon: undefined as string | undefined,
						})

			return connection.actors.map((actor) => ({
				id: `account-${wallet.rdns}-${actor}`,
				title: formatAddress(actor),
				href: `/account/${encodeURIComponent(
					connection.chainId != null
						? toInteropName(connection.chainId, actor, interopFormatConfig)
						: actor,
				)}`,
				tag: connection.status,
				icon: wallet.icon ?? undefined,
			}))
		}),
	)
	const navigationItems = $derived([
		{
			id: 'dashboard',
			title: 'Dashboard',
			href: '/dashboard',
		},
		{
			id: 'accounts',
			title: 'Accounts',
			href: '/accounts',
			defaultOpen: true,
			tag: String(accountNavItems.length),
			children: accountNavItems,
		},
		{
			id: 'actions',
			title: 'Actions',
			defaultOpen: true,
			children: [
				{ id: 'transfer', title: 'Transfer', href: '/session#transfer' },
				{ id: 'swap', title: 'Swap', href: '/session#swap' },
				{ id: 'bridge', title: 'Bridge', href: '/session#bridge' },
				{
					id: 'liquidity',
					title: 'Manage Liquidity',
					href: '/session#liquidity',
				},
			],
		},
		{
			id: 'sessions',
			title: 'Sessions',
			defaultOpen: false,
			href: '/sessions',
			children: (sessionsQuery.data ?? [])
				.map((result) => result.row)
				.sort((a, b) => b.updatedAt - a.updatedAt)
				.map((session) => ({
					id: `session-${session.id}`,
					title: sessionTitle(session),
					href: sessionHref(session),
					tag: session.status,
				})),
		},
		{
			id: 'explore',
			title: 'Explore',
			defaultOpen: true,
			children: [
				{
					id: 'coins',
					title: 'Coins',
					children: [
						{ id: 'usdc', title: 'USDC', href: '/coin/USDC' },
						{ id: 'eth', title: 'ETH', href: '/coin/ETH' },
					],
				},
				{
					id: 'networks',
					title: 'Networks',
					defaultOpen: false,
					children: relevantNetworkConfigs.map((config) => ({
						id: `network-${config.chainId}`,
						title: config.name,
						href: `/network/${toNetworkSlug(config.name)}`,
					})),
				},
			],
		},
		{
			id: 'multiplayer',
			title: 'Multiplayer',
			defaultOpen: true,
			children: [
				{
					id: 'rooms',
					title: 'Rooms',
					href: '/rooms',
					tag: String((roomsQuery.data ?? []).length),
					children: (roomsQuery.data ?? [])
						.map((result) => result.row)
						.sort((a, b) => a.createdAt - b.createdAt)
						.map((room) => ({
							id: `room-${room.id}`,
							title: room.name ?? roomIdToDisplayName(room.id),
							href: `/rooms/${room.id}`,
						})),
				},
				{
					id: 'peers',
					title: 'Peers',
					href: '/peers',
					tag: String(peersNavItems.length),
					children: peersNavItems,
				},
				{
					id: 'channels-yellow',
					title: 'Yellow Channels',
					href: '/channels/yellow',
				},
			],
		},
		{
			id: 'tests',
			title: 'Tests',
			defaultOpen: true,
			children: [
				{
					id: 'test-collections',
					title: 'Collections',
					href: '/test/collections',
				},
				{
					id: 'test-networks-coins',
					title: 'Networks & coins',
					href: '/test/networks-coins',
				},
				{
					id: 'test-chain-id',
					title: 'Chain ID (Voltaire)',
					href: '/test/chain-id',
				},
			],
		},
	])


	// Components
	import { Tooltip } from 'bits-ui'
	import Boundary from '$/components/Boundary.svelte'
	import IntentDragPreview from '$/components/IntentDragPreview.svelte'
	import GraphScene from '$/routes/GraphScene.svelte'
	import Navigation from '$/views/Navigation.svelte'
	import ToastContainer from '$/views/ToastContainer.svelte'


	// Images
	import favicon from '$/lib/assets/favicon.svg'


	// Styles
	import '$/styles/reset.css'
	import '$/styles/colors.css'
	import '$/styles/fonts.css'
	import '$/styles/components.css'
	import '$/styles/accessibility.css'
	// import '$/styles/responsive.css'
	import '$/styles/bits-ui.css'
</script>


<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>


<Tooltip.Provider>
	<div
		id="layout"
		class="layout"
		data-scroll-container
		data-sticky-container
		{@attach liveQueryAttachment}
	>
		<a href="#main" class="skip-link">Skip to main content</a>

		<Navigation {navigationItems}></Navigation>

		<main id="main" tabindex="-1" data-sticky-container>
			<section data-scroll-item>
				<Boundary>
					{@render children()}

					{#snippet Failed(error, retry)}
						<div data-column>
							<h2>Error</h2>
							<p>{error instanceof Error ? error.message : String(error)}</p>
							<button type="button" onclick={retry}>Retry</button>
						</div>
					{/snippet}
				</Boundary>
			</section>
		</main>

		<IntentDragPreview />

		<ToastContainer position="bottom-right" />

		<button
			type="button"
			class="graph-toggle"
			onclick={() => {
				showGraph = !showGraph
			}}
			title={showGraph ? 'Hide data graph' : 'Show data graph'}
		>
			{showGraph ? '✕' : '◉'}
		</button>

		<GraphScene
			visible={showGraph}
			queryStack={localLiveQueryCtx.stack}
			globalQueryStack={globalLiveQueryCtx.stack}
		/>
	</div>
</Tooltip.Provider>



<style>
	.layout {
		/* Constants */
		--navigation-desktop-inlineSize: 20rem;
		--navigation-mobile-blockSize: 4.16rem;

		/* Rules */
		width: 100dvw;
		height: 100dvh;
		padding: var(--safeArea-insetTop) var(--safeArea-insetRight)
			var(--safeArea-insetBottom) var(--safeArea-insetLeft);
		display: grid;
		align-items: start;
		gap: var(--separator-width);

		&[data-scroll-container] {
			--sticky-paddingBlockStart: var(--safeArea-insetTop);
			--sticky-paddingBlockEnd: var(--safeArea-insetBottom);
			--sticky-paddingInlineStart: var(--safeArea-insetLeft);
			--sticky-paddingInlineEnd: var(--safeArea-insetRight);
		}

		@media not (max-width: 1024px) {
			grid-template:
				'Nav Main' 100dvh
				/ var(--navigation-desktop-inlineSize) minmax(auto, 1fr);

			&[data-sticky-container] {
				--sticky-marginInlineStart: var(--separator-width);
				--sticky-paddingInlineStart: var(--navigation-desktop-inlineSize);
			}
		}

		@media (max-width: 1024px) {
			grid-template:
				'Nav' var(--navigation-mobile-blockSize)
				'Main' 1fr
				/ minmax(auto, 1fr);

			&[data-sticky-container] {
				--sticky-marginBlockStart: var(--separator-width);
				--sticky-paddingBlockStart: var(--navigation-mobile-blockSize);
			}
		}

		:global {
			> nav {
				grid-area: Nav;
				box-shadow: 0 0 0 var(--separator-width) var(--color-border);
			}

			> main {
				grid-area: Main;

				&[data-sticky-container] {
					--scrollItem-inlineDetached-maxSize: 54rem;
					--scrollItem-inlineDetached-paddingStart: 2rem;
					--scrollItem-inlineDetached-maxPaddingMatchStart: 5rem;
					--scrollItem-inlineDetached-paddingEnd: 2rem;
					--scrollItem-inlineDetached-maxPaddingMatchEnd: 5rem;
				}
			}
		}
	}

	.graph-toggle {
		position: fixed;
		bottom: 1rem;
		right: 460px;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--color-bg-page);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-md);
		cursor: pointer;
		font-size: 0.75rem;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;

		&:hover {
			transform: scale(1.1);
			box-shadow: var(--shadow-lg);
			background: var(--color-bg-subtle);
		}
	}
</style>
