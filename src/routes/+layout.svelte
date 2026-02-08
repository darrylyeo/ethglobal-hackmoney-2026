<script lang="ts">
	// Polyfills (run before other imports that may use crypto.randomUUID)
	import '$/lib/randomUuid.ts'

	// Profiles (boot/migrate before collections read from localStorage; browser-only)
	import { browser } from '$app/environment'
	import { ensureProfilesMeta } from '$/lib/profile.ts'
	if (browser) ensureProfilesMeta()


	// Types/constants
	import { DataSource } from '$/constants/data-sources.ts'
	import { ActionType, actionTypeDefinitionByActionType } from '$/constants/intents.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { networkConfigs, toNetworkSlug } from '$/constants/networks.ts'
	import {
		WalletConnectionTransport,
		toWalletConnectionStatus,
	} from '$/data/WalletConnection.ts'


	// Context
	import { eq, not, useLiveQuery } from '@tanstack/svelte-db'
	import { myPeerIdsCollection } from '$/collections/MyPeerIds.ts'
	import { roomPeersCollection } from '$/collections/RoomPeers.ts'
	import { roomsCollection } from '$/collections/Rooms.ts'
	import { agentChatTreesCollection } from '$/collections/AgentChatTrees.ts'
	import { transactionsCollection } from '$/collections/Transactions.ts'
	import { transactionSessionsCollection } from '$/collections/TransactionSessions.ts'
	import { verificationsCollection } from '$/collections/Verifications.ts'
	import {
		dashboardPanelsCollection,
		ensureDefaultRow,
	} from '$/collections/DashboardPanels.ts'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { watchedEntitiesCollection } from '$/collections/WatchedEntities.ts'
	import { walletsCollection } from '$/collections/Wallets.ts'
	import {
		createLiveQueryContext,
		registerGlobalLiveQueryStack,
		setGlobalLiveQueryContext,
		setLocalLiveQueryContext,
		useGlobalQueries,
		useLocalQueries,
	} from '$/svelte/live-query-context.svelte.ts'


	// Functions
	import { formatAddress } from '$/lib/address.ts'
	import {
		roomIdToDisplayName,
		roomIdToPlaceEmoji,
	} from '$/lib/rooms/room.ts'
	import { buildSessionHash } from '$/lib/session/sessions.ts'
	import type { SessionAction } from '$/data/TransactionSession.ts'
	import { interopFormatConfig, toInteropName } from '$/constants/interop.ts'

	const actionLabel = (action: string) =>
		action.length > 0
			? `${action[0].toUpperCase()}${action.slice(1)}`
			: 'Session'
	const sessionTitle = (session: { id: string; actions: SessionAction[] }) =>
		`${actionLabel(session.actions[0]?.type ?? '')} ${session.id.slice(0, 6)}`
	const sessionHref = (session: { id: string }) =>
		`/session${buildSessionHash(session.id)}`


	// Props
	let { children } = $props()


	// State
	const globalLiveQueryCtx = createLiveQueryContext()
	const localLiveQueryCtx = createLiveQueryContext()
	setGlobalLiveQueryContext(globalLiveQueryCtx)
	setLocalLiveQueryContext(localLiveQueryCtx)


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
	const agentChatTreesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: agentChatTreesCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	const pinnedAgentChatTrees = $derived(
		(agentChatTreesQuery.data ?? [])
			.map((result) => result.row)
			.filter((tree) => tree.pinned)
			.sort((a, b) => b.updatedAt - a.updatedAt),
	)
	const watchedEntitiesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: watchedEntitiesCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	const recentTransactionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionsCollection })
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
	const dashboardsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardPanelsCollection })
				.where(({ row }) => not(eq(row.$id.id, '__default__')))
				.select(({ row }) => ({
					id: row.$id.id,
					name: 'name' in row ? row.name : undefined,
					icon: 'icon' in row ? row.icon : undefined,
				})),
		[],
	)
	const defaultDashboardRowQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardPanelsCollection })
				.where(({ row }) => eq(row.$id.id, '__default__'))
				.select(({ row }) =>
					'defaultDashboardId' in row
						? { defaultDashboardId: row.defaultDashboardId }
						: { defaultDashboardId: undefined as string | undefined },
				),
		[],
	)
	$effect(() => {
		ensureDefaultRow()
	})
	const defaultDashboardId = $derived(
		defaultDashboardRowQuery.data?.[0]?.defaultDashboardId ?? 'default',
	)
	const dashboardNavItems = $derived(
		(dashboardsQuery.data ?? []).map(({ id, name, icon }) => ({
			id: `dashboard-${id}`,
			title: name ?? (id === 'default' ? 'My Dashboard' : 'Unnamed'),
			href: id === defaultDashboardId ? '/dashboard' : `/dashboard?d=${id}`,
			icon:
				icon ??
				(id === defaultDashboardId ? '★' : '📊'),
		})),
	)
	registerGlobalLiveQueryStack(() => [
		{ id: 'layout-wallet-connections', label: 'Wallet Connections', query: walletConnectionsQuery },
		{ id: 'layout-sessions', label: 'Sessions', query: sessionsQuery },
		{ id: 'layout-wallets', label: 'Wallets', query: walletsQuery },
		{ id: 'layout-transactions', label: 'Transactions', query: recentTransactionsQuery },
		{ id: 'layout-watched', label: 'Watched Entities', query: watchedEntitiesQuery },
	])
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
					icon: '🤝',
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
				address: {
					network: connection.chainId ?? undefined,
					address: actor as `0x${string}`,
				},
				href: `/account/${encodeURIComponent(
					connection.chainId != null
						? toInteropName(
								connection.chainId,
								actor,
								interopFormatConfig,
							)
						: actor,
				)}`,
				tag: toWalletConnectionStatus(connection.status),
				tagIcon: wallet.icon,
			}))
		}),
	)

	// Full entity lists (allChildren — shown when section contains current page)
	const allSessionNavItems = $derived(
		(sessionsQuery.data ?? [])
			.map((r) => r.row)
			.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
			.map((session) => ({
				id: `session-${session.id}`,
				title: sessionTitle(session),
				href: sessionHref(session),
				tag: session.status,
				icon: '📋',
			})),
	)
	const allRoomNavItems = $derived(
		(roomsQuery.data ?? [])
			.map((r) => r.row)
			.sort((a, b) => a.createdAt - b.createdAt)
			.map((room) => ({
				id: `room-${room.id}`,
				title: room.name ?? roomIdToDisplayName(room.id),
				href: `/rooms/${room.id}`,
				icon: roomIdToPlaceEmoji(room.id),
			})),
	)
	const allNetworkNavItems = $derived(
		relevantNetworkConfigs.map((config) => ({
			id: `network-${config.chainId}`,
			title: config.name,
			href: `/network/${toNetworkSlug(config.name)}`,
			icon: config.icon ?? '🌐',
		})),
	)
	const allAgentTreeNavItems = $derived(
		(agentChatTreesQuery.data ?? [])
			.map((r) => r.row)
			.sort((a, b) => b.updatedAt - a.updatedAt)
			.map((tree) => ({
				id: `agent-${tree.id}`,
				title: tree.name ?? 'Untitled',
				href: `/agents/${tree.id}`,
				icon: '🤖',
			})),
	)

	// Watched entity hrefs (auto-watch sources + manual)
	const watchedHrefs = $derived(
		new Set([
			...accountNavItems.map((item) => item.href),
			...(sessionsQuery.data ?? [])
				.filter((r) => r.row.status === 'Draft' || r.row.status === 'Submitted')
				.map((r) => sessionHref(r.row)),
			...(recentTransactionsQuery.data ?? [])
				.filter((r) => r.row.status === 'completed' || r.row.status === 'failed')
				.flatMap((r) => {
					const config = networkConfigs.find((c) => c.chainId === r.row.fromChainId)
					return config
						? [`/network/${toNetworkSlug(config.name)}/transaction/${r.row.$id.sourceTxHash}`]
						: []
				}),
			...peersNavItems.map((item) => item.href),
			...pinnedAgentChatTrees.map((tree) => `/agents/${tree.id}`),
			...relevantNetworkConfigs.map((c) => `/network/${toNetworkSlug(c.name)}`),
			...(watchedEntitiesQuery.data ?? []).map((r) => r.row.href),
		]),
	)
	const manualWatchedHrefs = $derived(
		new Set((watchedEntitiesQuery.data ?? []).map((r) => r.row.href)),
	)
	const filterWatched = <T extends { href: string }>(items: T[]) =>
		items.filter((item) => watchedHrefs.has(item.href))
	const withManualWatch = <T extends { href: string }>(items: T[]) =>
		items.map((item) => ({
			...item,
			manualWatch: manualWatchedHrefs.has(item.href),
		}))

	const navigationItems = $derived([
		{
			id: 'dashboards',
			title: 'Dashboards',
			href: '/dashboards',
			icon: '📊',
			defaultOpen: true,
			children: withManualWatch(dashboardNavItems),
		},
		{
			id: 'accounts',
			title: 'Accounts',
			href: '/accounts',
			icon: '👤',
			defaultOpen: true,
			tag: String(accountNavItems.length),
			children: withManualWatch(accountNavItems),
		},
		{
			id: 'actions',
			title: 'Actions',
			href: '/actions',
			icon: '⚡',
			defaultOpen: true,
			children: (
				[
					ActionType.Swap,
					ActionType.Bridge,
					ActionType.Transfer,
					ActionType.AddLiquidity,
				] as const
			).map((actionType) => {
				const spec = actionTypeDefinitionByActionType[actionType]
				return {
					id: spec.type,
					title: spec.label,
					href: `/session#/${spec.type}`,
					icon: spec.icon,
				}
			}),
		},
		{
			id: 'sessions',
			title: 'Sessions',
			href: '/sessions',
			icon: '📋',
			defaultOpen: false,
			children: withManualWatch(filterWatched(allSessionNavItems)),
			allChildren: withManualWatch(allSessionNavItems),
		},
		{
			id: 'agents',
			title: 'Agents',
			href: '/agents',
			icon: '🤖',
			defaultOpen: true,
			children: [
				{ id: 'agents-new', title: 'New conversation', href: '/agents/new', icon: '✨' },
				{ id: 'agents-api-keys', title: 'API keys', href: '/settings/llm', icon: '🔑' },
				...withManualWatch(filterWatched(allAgentTreeNavItems)),
			],
			allChildren: [
				{ id: 'agents-new', title: 'New conversation', href: '/agents/new', icon: '✨' },
				{ id: 'agents-api-keys', title: 'API keys', href: '/settings/llm', icon: '🔑' },
				...withManualWatch(allAgentTreeNavItems),
			],
		},
		{
			id: 'explore',
			title: 'Explore',
			icon: '🧭',
			defaultOpen: true,
			children: [
				{
					id: 'coins',
					title: 'Coins',
					icon: '🪙',
					children: [
						{
							id: 'usdc',
							title: 'USDC',
							href: '/coin/USDC',
							icon: iconUsdc,
						},
						{
							id: 'eth',
							title: 'ETH',
							href: '/coin/ETH',
							icon: iconEth,
						},
					],
				},
				{
					id: 'networks',
					title: 'Networks',
					icon: '⛓️',
					defaultOpen: false,
					children: withManualWatch(filterWatched(allNetworkNavItems)),
					allChildren: withManualWatch(allNetworkNavItems),
				},
			],
		},
		{
			id: 'positions',
			title: 'Positions',
			icon: '📍',
			defaultOpen: true,
			children: [
				{
					id: 'positions-liquidity',
					title: 'Liquidity',
					href: '/positions/liquidity',
					icon: '🪣',
				},
				{
					id: 'positions-channels',
					title: 'Channels',
					href: '/positions/channels',
					icon: '↔️',
				},
			],
		},
		{
			id: 'multiplayer',
			title: 'Multiplayer',
			icon: '🤝',
			defaultOpen: true,
			children: [
				{
					id: 'rooms',
					title: 'Rooms',
					href: '/rooms',
					icon: '🏘️',
					tag: String(allRoomNavItems.length),
					children: withManualWatch(filterWatched(allRoomNavItems)),
					allChildren: withManualWatch(allRoomNavItems),
				},
				{
					id: 'peers',
					title: 'Peers',
					href: '/peers',
					icon: '👥',
					tag: String(peersNavItems.length),
					children: withManualWatch(peersNavItems),
				},
			],
		},
		// {
		// 	id: 'tests',
		// 	title: 'Tests',
		// 	icon: '🧪',
		// 	defaultOpen: true,
		// 	children: [
		// 		{
		// 			id: 'test-networks-coins',
		// 			title: 'Networks & coins',
		// 			href: '/test/networks-coins',
		// 			icon: '🔗',
		// 		},
		// 		{
		// 			id: 'test-chain-id',
		// 			title: 'Chain ID (Voltaire)',
		// 			href: '/test/chain-id',
		// 			icon: '#️⃣',
		// 		},
		// 		{
		// 			id: 'test-intents',
		// 			title: 'Intents',
		// 			href: '/test/intents',
		// 			icon: '📌',
		// 		},
		// 	],
		// },
	])


	// Components
	import iconEth from '$/assets/coins/eth.svg?url'
	import iconUsdc from '$/assets/coins/usdc.svg?url'
	import { Tooltip } from 'bits-ui'
	import Boundary from '$/components/Boundary.svelte'
	import IntentDragPreview from '$/components/IntentDragPreview.svelte'
	import GraphScene from '$/routes/GraphScene.svelte'
	import Navigation from '$/views/Navigation.svelte'
	import ToastContainer from '$/views/ToastContainer.svelte'


	// Images
	import favicon from '$/assets/favicon.svg'


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
	<link
		rel="icon"
		href={favicon}
	/>
</svelte:head>


<Tooltip.Provider>
	<div
		id="layout"
		data-scroll-container
		data-sticky-container
	>
		<a
			href="#main"
			class="skip-link"
		>Skip to main content</a>

		<Navigation
			{navigationItems}
		/>

		<div
			class="layout-main"
			data-sticky-container
			data-column
		>
			<aside
				id="global-graph"
				data-sticky="backdrop-none"
			>
				<GraphScene
					queryStack={localLiveQueryCtx.stack}
					globalQueryStack={globalLiveQueryCtx.stack}
				/>
			</aside>

			<Boundary>
				{@render children()}

				{#snippet failed(error)}
					<main data-column>
						<h2>{(error as unknown as Error).status}</h2>

						<p>{(error as unknown as Error).message}</p>
					</main>
				{/snippet}
			</Boundary>
		</div>
	</div>

	<IntentDragPreview />

	<ToastContainer position="bottom-right" />
</Tooltip.Provider>


<style>
	#layout {
		/* Constants */
		--navigation-desktop-inlineSize: 21rem;
		--navigation-mobile-blockSize: 4rem;

		/* Rules */
		width: 100dvw;
		height: 100dvh;
		padding: var(--safeArea-insetTop) var(--safeArea-insetRight) var(--safeArea-insetBottom) var(--safeArea-insetLeft);
		display: grid;
		align-items: start;
		gap: var(--separator-width);

		&[data-scroll-container] {
			--sticky-paddingBlockStart: var(--safeArea-insetTop);
			--sticky-paddingBlockEnd: var(--safeArea-insetBottom);
			--sticky-paddingInlineStart: var(--safeArea-insetLeft);
			--sticky-paddingInlineEnd: var(--safeArea-insetRight);
		}

		@media (width >= 60rem) {
			grid-template:
				'Nav Main' 100dvh
				/ auto minmax(auto, 1fr)
			;

			&[data-sticky-container] {
				--sticky-marginInlineStart: var(--separator-width);
				--sticky-paddingInlineStart: var(--navigation-desktop-inlineSize);
			}
		}

		@media (width < 60rem) {
			grid-template:
				'Nav' var(--navigation-mobile-blockSize)
				'Main' 1fr
				/ minmax(auto, 1fr)
			;

			&[data-sticky-container] {
				--sticky-marginBlockStart: var(--separator-width);
				--sticky-paddingBlockStart: var(--navigation-mobile-blockSize);
			}
		}

		> :global(nav) {
			grid-area: Nav;
			box-shadow: 0 0 0 var(--separator-width) var(--border-color);

			max-inline-size: var(--navigation-desktop-inlineSize);
			resize: horizontal;
		}

		> .main-area {
			grid-area: Main;

			--sticky-paddingInlineStart: clamp(1rem, 6cqi, 2rem);
			--sticky-paddingInlineEnd: clamp(1rem, 6cqi, 2rem);

			> :global(main) {
				--graph-scroll-blur-size: 1rem;

				position: relative;
				min-height: 100dvh;

				&::before,
				&::after {
					content: '';
					position: absolute;
					inset: calc(-1 * var(--graph-scroll-blur-size));
					pointer-events: none;
					mask-size: 100% 100%;
					mask-repeat: no-repeat;
				}

				&::before {
					backdrop-filter: blur(calc(8px * (1 - var(--graph-scroll-progress, 0))));
					mask-image: linear-gradient(
						to bottom,
						transparent 0%,
						black 100%
					);
					mask-position: 0 0;
				}

				&::after {
					bottom: calc(-1 * var(--graph-scroll-blur-size));
					backdrop-filter: blur(calc(8px * var(--graph-scroll-progress, 0)));
					-webkit-backdrop-filter: blur(calc(8px * var(--graph-scroll-progress, 0)));
					mask-image: linear-gradient(
						to top,
						transparent 0%,
						black 100%
					);
					mask-position: 0 100%;
				}
			}
		}
	}

	#global-graph {
		z-index: -1;
	}
</style>
