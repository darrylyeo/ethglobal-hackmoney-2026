import { ActionType, actionTypeDefinitionByActionType } from '$/constants/actions.ts'
import { ChainId, networkConfigs, toNetworkSlug } from '$/constants/networks.ts'
import { interopFormatConfig, toInteropName } from '$/constants/interop.ts'
import type { Action } from '$/data/Session.ts'
import { SessionStatus } from '$/data/Session.ts'
import {
	ConnectionStatus,
	WalletConnectionTransport,
	toWalletConnectionStatus,
} from '$/data/WalletConnection.ts'
import { formatAddress } from '$/lib/address.ts'
import {
	roomIdToDisplayName,
	roomIdToPlaceEmoji,
} from '$/lib/rooms/room.ts'
import {
	buildSessionPath,
	formatSessionPlaceholderName,
} from '$/lib/session/sessions.ts'
import type { NavigationItem } from '$/views/NavigationItem.svelte'

type SessionRow = { id: string; name?: string; actions: Action[]; status: string; updatedAt?: number; params?: Record<string, unknown>; execution?: { chainId?: number } }
type RoomRow = { id: string; name?: string; createdAt: number }
type AgentTreeRow = { id: string; name: string | null; pinned?: boolean; updatedAt: number }
type WatchedRow = { href: string }
type BridgeTxRow = { fromChainId: number; status: string; $id: { sourceTxHash: string } }
type WalletRow = { $id: { rdns: string }; icon?: string }
type WalletConnectionRow = {
	$id: { wallet$id: { rdns: string } }
	status: ConnectionStatus
	transport: WalletConnectionTransport
	chainId: number | null
	actors: `0x${string}`[]
}
type VerificationRow = { verifierPeerId: string; verifiedPeerId: string; address: string; status: string }
type RoomPeerRow = { peerId: string; displayName?: string; isConnected: boolean }
type MyPeerRow = { peerId: string }
export type NavigationItemsInput = {
	sessionsData?: { row: SessionRow }[]
	roomsData?: { row: RoomRow }[]
	agentChatTreesData?: { row: AgentTreeRow }[]
	watchedEntitiesData?: { row: WatchedRow }[]
	recentTransactionsData?: { row: BridgeTxRow }[]
	walletsData?: { row: WalletRow }[]
	walletConnectionsData?: { row: WalletConnectionRow }[]
	verificationsData?: { row: VerificationRow }[]
	roomPeersData?: { row: RoomPeerRow }[]
	myPeerIdsData?: { row: MyPeerRow }[]
	dashboardsData?: { id: string; name?: string; icon?: string }[]
	defaultDashboardId: string
	coinIcons: { eth: string; usdc: string }
	/** When true, default nav networks show testnets (e.g. Ethereum Sepolia); otherwise mainnets (e.g. Ethereum). */
	isTestnet: boolean
}

const sessionTitle = (session: { name?: string; actions: Action[] }) =>
	session.name ?? formatSessionPlaceholderName(session.actions)
const sessionIcon = (session: { actions: Action[] }) =>
	(actionTypeDefinitionByActionType as Record<string, { icon: string }>)[session.actions[0]?.type]?.icon ?? '📋'
const sessionHref = (session: { id: string }) => buildSessionPath(session.id)

export function getNavigationItems(input: NavigationItemsInput): NavigationItem[] {
	const {
		sessionsData = [],
		roomsData = [],
		agentChatTreesData = [],
		watchedEntitiesData = [],
		recentTransactionsData = [],
		walletsData = [],
		walletConnectionsData = [],
		verificationsData = [],
		roomPeersData = [],
		myPeerIdsData = [],
		dashboardsData = [],
		defaultDashboardId,
		coinIcons,
		isTestnet,
	} = input

	const pinnedAgentChatTrees = agentChatTreesData
		.map((r) => r.row)
		.filter((tree) => tree.pinned)
		.sort((a, b) => b.updatedAt - a.updatedAt)
	const walletsByRdns = new Map(walletsData.map((r) => [r.row.$id.rdns, r.row]))
	const connectedWalletConnections = (walletConnectionsData ?? [])
		.map((r) => r.row)
		.filter((row) => (row as { status?: string }).status === 'connected')
		.sort(
			(a, b) =>
				(a.transport === WalletConnectionTransport.None ? 1 : 0) -
				(b.transport === WalletConnectionTransport.None ? 1 : 0),
		)
	const relevantChainIds = [
		...connectedWalletConnections
			.map((c) => c.chainId)
			.filter((id): id is number => id != null),
		...sessionsData.flatMap((r) => {
			const row = r.row
			const ids: number[] = []
			if (typeof row.execution?.chainId === 'number') ids.push(row.execution.chainId)
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
	].filter((id) => Number.isSafeInteger(id) && id > 0)
	const relevantNetworkConfigs = [...new Set(relevantChainIds)]
		.map((chainId) => networkConfigs.find((c) => c.chainId === chainId))
		.filter((c): c is NonNullable<typeof c> => c != null)
	const myPeerIdsSet = new Set(myPeerIdsData.map((r) => r.row.peerId))
	const verifiedByMeVerifications = verificationsData.filter(
		(r) => myPeerIdsSet.has(r.row.verifierPeerId) && r.row.status === 'verified',
	)
	const peerIdToRoomPeers = roomPeersData.reduce(
		(acc, { row }) => {
			const list = acc.get(row.peerId) ?? []
			list.push(row)
			acc.set(row.peerId, list)
			return acc
		},
		new Map<string, { displayName?: string; isConnected: boolean }[]>(),
	)
	const peersNavItems = verifiedByMeVerifications
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
		})
	const accountNavItems = connectedWalletConnections.flatMap((connection) => {
		const rdns = connection.$id.wallet$id.rdns
		const wallet =
			connection.transport === WalletConnectionTransport.None
				? { name: 'Watching', rdns, icon: undefined as string | undefined }
				: (walletsByRdns.get(rdns) ?? { name: rdns, rdns, icon: undefined as string | undefined })
		return connection.actors.map((actor) => ({
			id: `account-${wallet.rdns}-${actor}`,
			title: formatAddress(actor),
			address: {
				network:
					connection.transport === WalletConnectionTransport.None
						? undefined
						: connection.chainId ?? undefined,
				address: actor,
			},
			href: `/account/${encodeURIComponent(
				connection.chainId != null
					? toInteropName(connection.chainId, actor, interopFormatConfig)
					: actor,
			)}`,
			tag:
				connection.transport === WalletConnectionTransport.None
					? 'Watching'
					: toWalletConnectionStatus(connection.status),
			tagIcon: wallet.icon,
		}))
	})
	const dashboardNavItems = dashboardsData.map((row) => ({
		id: `dashboard-${row.id}`,
		title: row.name ?? (row.id === 'default' ? 'My Dashboard' : 'Unnamed'),
		href: row.id === defaultDashboardId ? '/dashboard' : `/dashboard?d=${row.id}`,
		icon: row.icon ?? (row.id === defaultDashboardId ? '★' : '📊'),
	}))
	const allSessionNavItems = sessionsData
		.map((r) => r.row)
		.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
		.map((session) => ({
			id: `session-${session.id}`,
			title: sessionTitle(session),
			href: sessionHref(session),
			tag: session.status,
			icon: sessionIcon(session),
		}))
	const allRoomNavItems = roomsData
		.map((r) => r.row)
		.sort((a, b) => a.createdAt - b.createdAt)
		.map((room) => ({
			id: `room-${room.id}`,
			title: room.name ?? roomIdToDisplayName(room.id),
			href: `/rooms/${room.id}`,
			icon: roomIdToPlaceEmoji(room.id),
		}))
	const defaultNetworkChainIds: ChainId[] = [
		isTestnet ? ChainId.EthereumSepolia : ChainId.Ethereum,
	]
	const defaultNetworkConfigs = defaultNetworkChainIds
		.map((chainId) => networkConfigs.find((c) => c.chainId === chainId))
		.filter((c): c is NonNullable<typeof c> => c != null)
	const toNetworkNavItem = (config: (typeof relevantNetworkConfigs)[number]) => ({
		id: `network-${config.chainId}`,
		title: config.name,
		href: `/network/${toNetworkSlug(config.name)}`,
		icon: config.icon ?? '🌐',
	})
	const allNetworkNavItems = [
		...defaultNetworkConfigs.map(toNetworkNavItem),
		...relevantNetworkConfigs
			.filter((c) => !defaultNetworkChainIds.includes(c.chainId))
			.map(toNetworkNavItem),
	]
	const allAgentTreeNavItems = agentChatTreesData
		.map((r) => r.row)
		.sort((a, b) => b.updatedAt - a.updatedAt)
		.map((tree) => ({
			id: `agent-${tree.id}`,
			title: tree.name ?? 'Untitled',
			href: `/agents/${tree.id}`,
			icon: '🤖',
		}))
	const watchedHrefs = new Set([
		...accountNavItems.map((item) => item.href),
		...sessionsData
			.filter(
				(r) =>
					r.row.status === SessionStatus.Draft || r.row.status === SessionStatus.Submitted,
			)
			.map((r) => sessionHref(r.row)),
		...recentTransactionsData
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
		...watchedEntitiesData.map((r) => r.row.href),
	])
	const manualWatchedHrefs = new Set(watchedEntitiesData.map((r) => r.row.href))
	const filterWatched = <T extends { href: string }>(items: T[]) =>
		items.filter((item) => watchedHrefs.has(item.href))
	const withManualWatch = <T extends { href: string }>(items: T[]) =>
		items.map((item) => ({ ...item, manualWatch: manualWatchedHrefs.has(item.href) }))

	return [
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
					ActionType.CreateChannel,
				] as const
			).map((actionType) => {
				const spec = actionTypeDefinitionByActionType[actionType]
				return { id: spec.type, title: spec.label, href: `/session?template=${spec.type}`, icon: spec.icon }
			}),
		},
		{
			id: 'sessions',
			title: 'Sessions',
			href: '/sessions',
			icon: '📋',
			defaultOpen: true,
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
			id: 'coins',
			title: 'Coins',
			href: '/coins',
			icon: '🪙',
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
					href: '/coins',
					icon: '🪙',
					defaultOpen: true,
					children: [
						{ id: 'usdc', title: 'USDC', href: '/coin/USDC', icon: coinIcons.usdc },
						{ id: 'eth', title: 'ETH', href: '/coin/ETH', icon: coinIcons.eth },
					],
				},
				{
					id: 'networks',
					title: 'Networks',
					href: '/networks',
					icon: '⛓️',
					defaultOpen: true,
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
				{ id: 'positions-liquidity', title: 'Liquidity', href: '/positions/liquidity', icon: '🪣' },
				{ id: 'positions-channels', title: 'Channels', href: '/positions/channels', icon: '↔️' },
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
	]
}
