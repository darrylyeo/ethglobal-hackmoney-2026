import { ActionType, actionTypeDefinitionByActionType } from '$/constants/actions.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { ercTokens } from '$/constants/coins.ts'
import {
	interopFormatConfig,
	toInteropName,
} from '$/constants/interop.ts'
import { networkConfigsByChainId } from '$/constants/networks.ts'
import { EntityType, type EntityId } from '$/data/$EntityType.ts'
import type { Action } from '$/data/Session.ts'
import {
	ConnectionStatus,
	WalletConnectionTransport,
	toWalletConnectionStatus,
} from '$/data/WalletConnection.ts'
import type {
	LegacyStoredRow,
	WatchedEntityRow,
	WatchedEntityStoredRow,
} from '$/collections/WatchedEntities.ts'
import {
	watchedEntitiesCollection,
	watchedEntityKey,
} from '$/collections/WatchedEntities.ts'
import { agentChatTreesCollection } from '$/collections/AgentChatTrees.ts'
import { bridgeTransactionsCollection } from '$/collections/BridgeTransactions.ts'
import {
	dashboardsCollection,
	ensureDefaultRow,
} from '$/collections/Dashboards.ts'
import { myPeerIdsCollection } from '$/collections/MyPeerIds.ts'
import { partykitRoomPeersCollection } from '$/collections/PartykitRoomPeers.ts'
import { partykitRoomsCollection } from '$/collections/PartykitRooms.ts'
import { sessionsCollection } from '$/collections/Sessions.ts'
import { siweVerificationsCollection } from '$/collections/SiweVerifications.ts'
import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
import { walletsCollection } from '$/collections/Wallets.ts'
import { formatAddress } from '$/lib/address.ts'
import { stringify } from 'devalue'
import {
	roomIdToDisplayName,
	roomIdToPlaceEmoji,
} from '$/lib/rooms/room.ts'
import {
	buildSessionPath,
	formatSessionPlaceholderName,
} from '$/lib/session/sessions.ts'
import { registerGlobalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
import type { NavigationItem } from '$/views/NavigationItem.svelte'
import { eq, not, useLiveQuery } from '@tanstack/svelte-db'

import iconEth from '$/assets/coins/eth.svg?url'
import iconUsdc from '$/assets/coins/usdc.svg?url'

type SessionRow = { id: string; name?: string; actions: Action[]; status: string; updatedAt?: number; params?: Record<string, unknown>; execution?: { chainId?: number } }
type RoomRow = { id: string; name?: string; createdAt: number }
type AgentTreeRow = { id: string; name: string | null; pinned?: boolean; updatedAt: number }
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
	watchedEntitiesData?: { row: WatchedEntityRow }[]
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

const slug = (chainId: number) =>
	networkConfigsByChainId[chainId]?.slug ?? String(chainId)

function toEntityDisplay(
	entityType: EntityType,
	entityIdRaw: string | EntityId,
): { label: string; href: string; entityId: EntityId } | null {
	const normalizeStringId = (id: string) => ({ id } as EntityId)
	const id =
		typeof entityIdRaw === 'string' &&
		[EntityType.Session, EntityType.Room, EntityType.AgentChatTree].includes(
			entityType,
		)
			? normalizeStringId(entityIdRaw)
			: entityIdRaw
	if (typeof id !== 'object' || id == null) return null
	const fallback = (): { label: string; href: string; entityId: EntityId } => ({
		entityId: id as EntityId,
		label: stringify(id),
		href: `#${entityType}:${stringify(id)}`,
	})
	switch (entityType) {
		case EntityType.Coin: {
			const c = id as EntityId<EntityType.Coin>
			const token = ercTokens.find(
				(t) =>
					t.chainId === c.$network.chainId &&
					t.address.toLowerCase() === c.address.toLowerCase(),
			)
			return {
				entityId: c,
				label: c.interopAddress ?? token?.symbol ?? formatAddress(c.address),
				href: `/coin/${c.interopAddress ?? token?.symbol ?? formatAddress(c.address)}`,
			}
		}
		case EntityType.Network: {
			const n = id as EntityId<EntityType.Network>
			const config = networkConfigsByChainId[n.chainId]
			return {
				entityId: n,
				label: config?.name ?? String(n.chainId),
				href: `/network/${slug(n.chainId)}`,
			}
		}
		case EntityType.Contract: {
			const c = id as EntityId<EntityType.Contract>
			return {
				entityId: c,
				label: formatAddress(c.address),
				href: `/network/${slug(c.$network.chainId)}/contract/${c.address}`,
			}
		}
		case EntityType.Session: {
			const s = id as EntityId<EntityType.Session>
			return {
				entityId: s,
				label: s.id,
				href: buildSessionPath(s.id),
			}
		}
		case EntityType.Room: {
			const r = id as EntityId<EntityType.Room>
			return { entityId: r, label: r.id, href: `/rooms/${r.id}` }
		}
		case EntityType.AgentChatTree: {
			const a = id as EntityId<EntityType.AgentChatTree>
			return { entityId: a, label: a.id, href: `/agents/${a.id}` }
		}
		case EntityType.Actor: {
			const a = id as EntityId<EntityType.Actor>
			const chainId = a.$network.chainId
			const addr = a.address
			return {
				entityId: a,
				label: formatAddress(addr),
				href: `/account/${encodeURIComponent(
					a.interopAddress ??
						(chainId !== 1
							? toInteropName(chainId, addr, interopFormatConfig)
							: addr),
				)}`,
			}
		}
		case EntityType.Block: {
			const b = id as EntityId<EntityType.Block>
			return {
				entityId: b,
				label: `Block ${b.blockNumber}`,
				href: `/network/${slug(b.$network.chainId)}/block/${b.blockNumber}`,
			}
		}
		default:
			return fallback()
	}
}

const getEntityIdRaw = (
	stored: WatchedEntityStoredRow | LegacyStoredRow,
): string | EntityId => ('entityId' in stored ? stored.entityId : stored.id)

export function deriveWatchedEntityRow(
	stored: WatchedEntityStoredRow | LegacyStoredRow,
): WatchedEntityRow {
	const entityType = stored.entityType
	const entityIdRaw = getEntityIdRaw(stored)
	const id = watchedEntityKey({ entityType, entityId: entityIdRaw })
	const addedAt = stored.addedAt
	const display = toEntityDisplay(entityType, entityIdRaw)
	if (!display) {
		return {
			entityType,
			entityId: { chainId: 0 } as EntityId,
			addedAt,
			id,
			label: typeof entityIdRaw === 'string' ? entityIdRaw : stringify(entityIdRaw),
			href: `#${id}`,
		}
	}
	return {
		entityType,
		entityId: display.entityId,
		addedAt,
		id,
		label: display.label,
		href: display.href,
	}
}

export function listWatchedEntities(): WatchedEntityRow[] {
	return [...watchedEntitiesCollection.state]
		.map(([, row]) =>
			deriveWatchedEntityRow(row as WatchedEntityStoredRow | LegacyStoredRow),
		)
		.sort((a, b) => b.addedAt - a.addedAt)
}

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

	const walletsByRdns = new Map(walletsData.map((r) => [r.row.$id.rdns, r.row]))
	const connectedWalletConnections = (walletConnectionsData ?? [])
		.map((r) => r.row)
		.filter((row) => (row as { status?: string }).status === 'connected')
		.sort(
			(a, b) =>
				(a.transport === WalletConnectionTransport.None ? 1 : 0) -
				(b.transport === WalletConnectionTransport.None ? 1 : 0),
		)
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
	const dashboardNavItems = dashboardsData.map((row) => ({
		id: `dashboard-${row.id}`,
		title: row.name ?? (row.id === 'default' ? 'My Dashboard' : 'Unnamed'),
		href: row.id === defaultDashboardId ? '/dashboard' : `/dashboard?d=${row.id}`,
		icon: row.icon ?? (row.id === defaultDashboardId ? '★' : '📊'),
	}))
	const watchedRows = (watchedEntitiesData ?? []).map((r) => r.row)
	const watchedContracts = watchedRows.filter(
		(row) => row.entityType === EntityType.Contract,
	)
	const watchedSessionRows = watchedRows.filter(
		(row) => row.entityType === EntityType.Session,
	)
	const watchedActorRows = watchedRows.filter(
		(row) => row.entityType === EntityType.Actor,
	)
	const watchedRoomRows = watchedRows.filter(
		(row) => row.entityType === EntityType.Room,
	)
	const watchedAgentTreeRows = watchedRows.filter(
		(row) => row.entityType === EntityType.AgentChatTree,
	)
	const watchedCoinRows = watchedRows.filter(
		(row) => row.entityType === EntityType.Coin,
	)
	const watchedNetworkRows = watchedRows.filter(
		(row) => row.entityType === EntityType.Network,
	)
	const sessionsById = new Map(
		(sessionsData ?? []).map((r) => [r.row.id, r.row]),
	)
	const getSessionId = (row: WatchedEntityRow) =>
		typeof row.entityId === 'string'
			? row.entityId
			: (row.entityId as { id: string }).id
	const sessionNavItemsFromWatched = watchedSessionRows
		.map((row) => ({
			row,
			session: sessionsById.get(getSessionId(row)),
		}))
		.sort(
			(a, b) =>
				(b.session?.updatedAt ?? 0) - (a.session?.updatedAt ?? 0),
		)
		.map(({ row, session }) => ({
			id: row.id,
			title: session ? sessionTitle(session) : row.label,
			href: row.href,
			tag: session?.status,
			icon: session
				? (actionTypeDefinitionByActionType as Record<string, { icon: string }>)[
						session.actions[0]?.type
					]?.icon ?? '📋'
				: '📋',
		}))
	const toWatchedNavItem = (row: WatchedEntityRow) => ({
		id: row.id,
		title: row.label,
		href: row.href,
		manualWatch: true,
	})
	const toNetworkNavItemFromWatched = (row: WatchedEntityRow) => {
		const chainId = (row.entityId as { chainId: number }).chainId
		const config = networkConfigsByChainId[chainId]
		const baseHref = row.href
		const contractsOnNetwork = watchedContracts.filter(
			(c) =>
				c.href === `${baseHref}/contracts` ||
				c.href.startsWith(`${baseHref}/contract/`),
		)
		return {
			id: row.id,
			title: row.label,
			href: baseHref,
			icon: config?.icon ?? '🌐',
			children: [
				{
					id: `network-${chainId}-contracts`,
					title: 'Contracts',
					href: `${baseHref}/contracts`,
					icon: '📄',
				},
				...contractsOnNetwork.map((c) => ({
					id: c.id,
					title: c.label,
					href: c.href,
					icon: '📜' as string,
					manualWatch: true,
				})),
			],
		}
	}
	const allNetworkNavItems = watchedNetworkRows.map(toNetworkNavItemFromWatched)
	const accountNavItemsFromWatched = watchedActorRows.map((row) => {
		const aid = row.entityId as EntityId<EntityType.Actor>
		const conn = connectedWalletConnections.find((c) =>
			c.actors.some((a) => a.toLowerCase() === aid.address.toLowerCase()),
		)
		const wallet = conn
			? walletsByRdns.get(conn.$id.wallet$id.rdns) ??
				{ name: conn.$id.wallet$id.rdns, icon: undefined as string | undefined }
			: { name: 'Watching', icon: undefined as string | undefined }
		return {
			id: row.id,
			title: row.label,
			href: row.href,
			manualWatch: true,
			tag:
				conn?.transport === WalletConnectionTransport.None
					? 'Watching'
					: conn
						? toWalletConnectionStatus(conn.status)
						: undefined,
			tagIcon: wallet.icon,
			address: {
				network: aid.$network,
				address: aid.address,
			},
		}
	})
	const roomsById = new Map((roomsData ?? []).map((r) => [r.row.id, r.row]))
	const getRoomId = (row: WatchedEntityRow) =>
		typeof row.entityId === 'string'
			? row.entityId
			: (row.entityId as { id: string }).id
	const roomsNavItemsFromWatched = watchedRoomRows.map((row) => {
		const room = roomsById.get(getRoomId(row))
		return {
			...toWatchedNavItem(row),
			title: room?.name ?? row.label,
			icon: roomIdToPlaceEmoji(getRoomId(row)),
		}
	})
	const agentTreesById = new Map(
		(agentChatTreesData ?? []).map((r) => [r.row.id, r.row]),
	)
	const getAgentTreeId = (row: WatchedEntityRow) =>
		typeof row.entityId === 'string'
			? row.entityId
			: (row.entityId as { id: string }).id
	const agentsNavItemsFromWatched = watchedAgentTreeRows.map((row) => {
		const tree = agentTreesById.get(getAgentTreeId(row))
		return {
			...toWatchedNavItem(row),
			title: tree?.name ?? row.label,
			icon: '🤖',
		}
	})
	const coinsNavItemsFromWatched = watchedCoinRows.map((row) => {
		const c = row.entityId as EntityId<EntityType.Coin>
		const token = ercTokens.find(
			(t) =>
				t.chainId === c.$network.chainId &&
				t.address.toLowerCase() === c.address.toLowerCase(),
		)
		const icon =
			c.interopAddress === 'ETH'
				? coinIcons.eth
				: c.interopAddress === 'USDC'
					? coinIcons.usdc
					: '🪙'
		return {
			...toWatchedNavItem(row),
			icon,
		}
	})
	const verifiedPeerAddresses = new Set(
		verifiedByMeVerifications
			.filter((v) => peerIdToRoomPeers.has(v.row.verifiedPeerId))
			.map((v) => v.row.address.toLowerCase()),
	)
	const peersNavItemsFromWatched = accountNavItemsFromWatched.filter((item) =>
		verifiedPeerAddresses.has(
			(item.address?.address ?? '').toLowerCase(),
		),
	)
	const multiplayerChildren = [
		...(watchedRoomRows.length > 0
			? [
					{
						id: 'rooms',
						title: 'Rooms',
						href: '/rooms',
						icon: '🏘️',
						tag: String(watchedRoomRows.length),
						children: roomsNavItemsFromWatched,
						allChildren: roomsNavItemsFromWatched,
					},
				]
			: []),
		...(peersNavItemsFromWatched.length > 0
			? [
					{
						id: 'peers',
						title: 'Peers',
						href: '/peers',
						icon: '👥',
						tag: String(peersNavItemsFromWatched.length),
						children: peersNavItemsFromWatched,
					},
				]
			: []),
	]

	return [
		{
			id: 'dashboards',
			title: 'Dashboards',
			href: '/dashboards',
			icon: '📊',
			defaultIsOpen: true,
			children: dashboardNavItems,
		},
		{
			id: 'accounts',
			title: 'Accounts',
			href: '/accounts',
			icon: '👤',
			defaultIsOpen: true,
			tag: String(watchedActorRows.length),
			children: accountNavItemsFromWatched,
			allChildren: accountNavItemsFromWatched,
		},
		{
			id: 'actions',
			title: 'Actions',
			href: '/actions',
			icon: '⚡',
			defaultIsOpen: true,
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
			defaultIsOpen: true,
			tag: String(watchedSessionRows.length),
			children: sessionNavItemsFromWatched,
			allChildren: sessionNavItemsFromWatched,
		},
		{
			id: 'agents',
			title: 'Agents',
			href: '/agents',
			icon: '🤖',
			defaultIsOpen: true,
			children: [
				{ id: 'agents-new', title: 'New conversation', href: '/agents/new', icon: '✨' },
				{ id: 'agents-api-keys', title: 'API keys', href: '/settings/llm', icon: '🔑' },
				...agentsNavItemsFromWatched,
			],
			allChildren: [
				{ id: 'agents-new', title: 'New conversation', href: '/agents/new', icon: '✨' },
				{ id: 'agents-api-keys', title: 'API keys', href: '/settings/llm', icon: '🔑' },
				...agentsNavItemsFromWatched,
			],
		},
		{
			id: 'explore',
			title: 'Explore',
			icon: '🧭',
			defaultIsOpen: true,
			children: [
				{
					id: 'coins',
					title: 'Coins',
					href: '/coins',
					icon: '🪙',
					defaultIsOpen: true,
					children: coinsNavItemsFromWatched,
					allChildren: coinsNavItemsFromWatched,
				},
				{
					id: 'networks',
					title: 'Networks',
					href: '/networks',
					icon: '⛓️',
					defaultIsOpen: true,
					children: allNetworkNavItems,
					allChildren: allNetworkNavItems,
				},
			],
		},
		{
			id: 'positions',
			title: 'Positions',
			icon: '📍',
			defaultIsOpen: true,
			children: [
				{ id: 'positions-liquidity', title: 'Liquidity', href: '/positions/liquidity', icon: '🪣' },
				{ id: 'positions-channels', title: 'Channels', href: '/positions/channels', icon: '↔️' },
			],
		},
		...(multiplayerChildren.length > 0
			? [
					{
						id: 'multiplayer',
						title: 'Multiplayer',
						icon: '🤝',
						defaultIsOpen: true,
						children: multiplayerChildren,
					},
				]
			: []),
	]
}

export function useNavigationItems(options: {
	isTestnet: () => boolean
}): NavigationItem[] {
	const roomsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: partykitRoomsCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.select(({ row }) => ({ row })),
		[],
	)
	const sessionsQuery = useLiveQuery(
		(q) => q.from({ row: sessionsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const agentChatTreesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: agentChatTreesCollection })
				.select(({ row }) => ({ row })),
		[],
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
				.from({ row: bridgeTransactionsCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	const walletsQuery = useLiveQuery(
		(q) => q.from({ row: walletsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const walletConnectionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: walletConnectionsCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	const verificationsQuery = useLiveQuery(
		(q) =>
			q.from({ row: siweVerificationsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const roomPeersQuery = useLiveQuery(
		(q) =>
			q.from({ row: partykitRoomPeersCollection }).select(({ row }) => ({ row })),
		[],
	)
	const myPeerIdsQuery = useLiveQuery(
		(q) =>
			q.from({ row: myPeerIdsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const dashboardsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardsCollection })
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
				.from({ row: dashboardsCollection })
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
	registerGlobalLiveQueryStack(() => [
		{ id: 'layout-wallet-connections', label: 'Wallet Connections', query: walletConnectionsQuery },
		{ id: 'layout-sessions', label: 'Sessions', query: sessionsQuery },
		{ id: 'layout-wallets', label: 'Wallets', query: walletsQuery },
		{ id: 'layout-transactions', label: 'Transactions', query: recentTransactionsQuery },
		{ id: 'layout-watched', label: 'Watched Entities', query: watchedEntitiesQuery },
	])
	return getNavigationItems({
		sessionsData: sessionsQuery.data,
		roomsData: roomsQuery.data,
		agentChatTreesData: agentChatTreesQuery.data,
		watchedEntitiesData: (watchedEntitiesQuery.data ?? []).map((r) => ({
			row: deriveWatchedEntityRow(r.row as WatchedEntityStoredRow | LegacyStoredRow),
		})),
		recentTransactionsData: recentTransactionsQuery.data,
		walletsData: walletsQuery.data,
		walletConnectionsData: walletConnectionsQuery.data,
		verificationsData: verificationsQuery.data,
		roomPeersData: roomPeersQuery.data,
		myPeerIdsData: myPeerIdsQuery.data,
		dashboardsData: dashboardsQuery.data,
		defaultDashboardId:
			defaultDashboardRowQuery.data?.[0]?.defaultDashboardId ?? 'default',
		coinIcons: { eth: iconEth, usdc: iconUsdc },
		isTestnet: options.isTestnet(),
	})
}
