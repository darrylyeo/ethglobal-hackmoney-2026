import { eq, not, useLiveQuery } from '@tanstack/svelte-db'
import { stringify } from 'devalue'

import { agentChatTreesCollection } from '$/collections/AgentChatTrees.ts'
import { bridgeTransactionsCollection } from '$/collections/BridgeTransactions.ts'
import { contractsCollection } from '$/collections/Contracts.ts'
import { dashboardsCollection, ensureDefaultRow } from '$/collections/Dashboards.ts'
import { evmErrorsCollection } from '$/collections/EvmErrors.ts'
import { evmSelectorsCollection } from '$/collections/EvmSelectors.ts'
import { evmTopicsCollection } from '$/collections/EvmTopics.ts'
import { socialPostSessionsCollection } from '$/collections/SocialPostSessions.ts'
import { farcasterConnectionsCollection } from '$/collections/FarcasterConnections.ts'
import { myPeerIdsCollection } from '$/collections/MyPeerIds.ts'
import { partykitRoomPeersCollection } from '$/collections/PartykitRoomPeers.ts'
import { partykitRoomsCollection } from '$/collections/PartykitRooms.ts'
import { sessionsCollection } from '$/collections/Sessions.ts'
import { siweVerificationsCollection } from '$/collections/SiweVerifications.ts'
import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
import { walletsCollection } from '$/collections/Wallets.ts'
import type { WatchedEntityRow, WatchedEntityStoredRow } from '$/collections/WatchedEntities.ts'
import { watchedEntitiesCollection } from '$/collections/WatchedEntities.ts'
import { entityKey } from '$/lib/entity-key.ts'

import { ActionType, actionTypeDefinitionByActionType } from '$/constants/actions.ts'
import {
	SocialPostActionType,
	socialPostActionTypeDefinitionByType,
} from '$/constants/social-post-actions.ts'
import { getCoinIdForCoinEntity } from '$/lib/coin-entity.ts'
import { erc20TokenByNetwork, nativeCurrencyByNetwork } from '$/constants/coin-instances.ts'
import { CoinId, coinById } from '$/constants/coins.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { interopFormatConfig, toInteropName } from '$/constants/interop.ts'
import { networksByChainId, NetworkType } from '$/constants/networks.ts'

import { type EntityId, EntityType } from '$/data/$EntityType.ts'
import {
	FarcasterConnectionTransport,
	type FarcasterConnectionRow,
} from '$/data/FarcasterConnection.ts'
import { WalletConnectionTransport, toWalletConnectionStatus } from '$/data/WalletConnection.ts'

import { formatAddress } from '$/lib/address.ts'
import { getEvmErrorPath, getEvmSelectorPath, getEvmTopicPath } from '$/lib/signature-paths.ts'
import { roomIdToPlaceEmoji } from '$/lib/rooms/room.ts'
import { formatSocialPostSessionPlaceholderName } from '$/lib/session/socialPostSessionUrl.ts'
import { buildSessionPath, formatSessionPlaceholderName } from '$/lib/session/sessions.ts'

import {
	type LiveQueryEntry,
	registerGlobalLiveQueryStack,
} from '$/svelte/live-query-context.svelte.ts'
import type { NavigationItem } from '$/views/NavigationItem.svelte'


export function deriveWatchedEntityRow(stored: WatchedEntityStoredRow): WatchedEntityRow {
	const entityType = stored.entityType
	const entityIdRaw = stored.entityId
	const id = entityKey({ entityType, entityId: entityIdRaw })
	const addedAt = stored.addedAt
	const parsedId =
		typeof entityIdRaw === 'string' &&
		[EntityType.Session, EntityType.SocialPostSession, EntityType.Room, EntityType.AgentChatTree].includes(
			entityType,
		)
			? ({ id: entityIdRaw } as EntityId)
			: entityIdRaw
	const display =
		typeof parsedId !== 'object' || parsedId == null
			? null
			: (() => {
					switch (entityType) {
						case EntityType.Coin: {
							const c = parsedId as EntityId<EntityType.Coin>
							const coinId = getCoinIdForCoinEntity(
								EntityType.Coin,
								c as Record<string, unknown>,
							)
							if ('address' in c) {
								const token = erc20TokenByNetwork
									.get(c.$network.chainId)
									?.find(
										(t) =>
											t.$id.address.toLowerCase() ===
											c.address.toLowerCase(),
									)
								const label = coinId != null ? coinById[coinId]?.symbol : token?.symbol ?? formatAddress(c.address)
								return {
									entityId: c,
									label: label ?? '?',
									href: coinId != null ? `/coin/${coinId}` : `/coin/${label ?? ''}`,
								}
							}
							const native = nativeCurrencyByNetwork.get(c.$network.chainId)?.[0]
							return {
								entityId: c,
								label: coinId != null ? coinById[coinId]?.symbol ?? '?' : native?.symbol ?? '?',
								href: coinId != null ? `/coin/${coinId}` : `/coin/${native?.symbol ?? ''}`,
							}
						}
						case EntityType.Network: {
							const n = parsedId as EntityId<EntityType.Network>
							return {
								entityId: n,
								label: networksByChainId[n.chainId]?.name ?? String(n.chainId),
								href: `/network/${networksByChainId[n.chainId]?.slug ?? String(n.chainId)}`,
							}
						}
						case EntityType.Contract: {
							const c = parsedId as EntityId<EntityType.Contract>
							return {
								entityId: c,
								label: formatAddress(c.address),
								href: `/network/${networksByChainId[c.$network.chainId]?.slug ?? String(c.$network.chainId)}/contract/${c.address}`,
							}
						}
						case EntityType.Session: {
							const s = parsedId as EntityId<EntityType.Session>
							return { entityId: s, label: s.id, href: buildSessionPath(s.id) }
						}
						case EntityType.Room: {
							const r = parsedId as EntityId<EntityType.Room>
							return { entityId: r, label: r.id, href: `/rooms/${r.id}` }
						}
						case EntityType.AgentChatTree: {
							const a = parsedId as EntityId<EntityType.AgentChatTree>
							return { entityId: a, label: a.id, href: `/agents/${a.id}` }
						}
						case EntityType.Actor: {
							const a = parsedId as EntityId<EntityType.Actor>
							return {
								entityId: a,
								label: formatAddress(a.address),
								href: `/account/${encodeURIComponent(
									a.interopAddress ??
										(a.$network.chainId !== 1
											? toInteropName(
													a.$network.chainId,
													a.address,
													interopFormatConfig,
												)
											: a.address),
								)}`,
							}
						}
						case EntityType.Block: {
							const b = parsedId as EntityId<EntityType.Block>
							return {
								entityId: b,
								label: `Block ${b.blockNumber}`,
								href: `/network/${networksByChainId[b.$network.chainId]?.slug ?? String(b.$network.chainId)}/block/${b.blockNumber}`,
							}
						}
						case EntityType.SocialPostSession: {
							const s = parsedId as EntityId<EntityType.SocialPostSession>
							return {
								entityId: s,
								label: s.id,
								href: `/farcaster/session/${s.id}`,
							}
						}
						case EntityType.FarcasterChannel: {
							const ch = parsedId as EntityId<EntityType.FarcasterChannel>
							return {
								entityId: ch,
								label: ch.id,
								href: `/farcaster/channel/${encodeURIComponent(ch.id)}`,
							}
						}
						case EntityType.FarcasterUser: {
							const u = parsedId as EntityId<EntityType.FarcasterUser>
							return {
								entityId: u,
								label: `@${u.fid}`,
								href: `/farcaster/user/${u.fid}`,
							}
						}
						case EntityType.FarcasterCast: {
							const c = parsedId as EntityId<EntityType.FarcasterCast>
							return {
								entityId: c,
								label: `${c.fid}:${c.hash.slice(0, 10)}…`,
								href: `/farcaster/cast/${c.fid}/${c.hash}`,
							}
						}
						case EntityType.Eip8004Service: {
							const s = parsedId as EntityId<EntityType.Eip8004Service>
							const idStr = `${s.chainId}:${s.identityId}`
							return {
								entityId: s,
								label: s.identityId,
								href: `/agents/registry/${encodeURIComponent(idStr)}`,
							}
						}
						case EntityType.Proposal: {
							const p = parsedId as EntityId<EntityType.Proposal>
							const realm =
								p.id.startsWith('caip-')
									? 'chain-agnostic'
									: 'ethereum'
							return {
								entityId: p,
								label: p.id,
								href: `/proposals/${realm}/${p.id}`,
							}
						}
						case EntityType.EvmError: {
							const e = parsedId as EntityId<EntityType.EvmError>
							return {
								entityId: e,
								label: e.hex,
								href: getEvmErrorPath(e.hex),
							}
						}
						case EntityType.EvmSelector: {
							const s = parsedId as EntityId<EntityType.EvmSelector>
							return {
								entityId: s,
								label: s.hex,
								href: getEvmSelectorPath(s.hex),
							}
						}
						case EntityType.EvmTopic: {
							const t = parsedId as EntityId<EntityType.EvmTopic>
							return {
								entityId: t,
								label: t.hex,
								href: getEvmTopicPath(t.hex),
							}
						}
						default:
							return {
								entityId: parsedId as EntityId,
								label: stringify(parsedId),
								href: `#${entityType}:${stringify(parsedId)}`,
							}
					}
				})()
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

export class NavigationItems {
	readonly roomsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: partykitRoomsCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.select(({ row }) => ({ row })),
	)
	readonly sessionsQuery = useLiveQuery(
		(q) => q.from({ row: sessionsCollection }).select(({ row }) => ({ row })),
	)
	readonly agentChatTreesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: agentChatTreesCollection })
				.select(({ row }) => ({ row })),
	)
	readonly watchedEntitiesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: watchedEntitiesCollection })
				.select(({ row }) => ({ row })),
	)
	readonly recentTransactionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: bridgeTransactionsCollection })
				.select(({ row }) => ({ row })),
	)
	readonly walletsQuery = useLiveQuery(
		(q) => q.from({ row: walletsCollection }).select(({ row }) => ({ row })),
	)
	readonly walletConnectionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: walletConnectionsCollection })
				.select(({ row }) => ({ row })),
	)
	readonly verificationsQuery = useLiveQuery(
		(q) =>
			q.from({ row: siweVerificationsCollection }).select(({ row }) => ({ row })),
	)
	readonly roomPeersQuery = useLiveQuery(
		(q) =>
			q.from({ row: partykitRoomPeersCollection }).select(({ row }) => ({ row })),
	)
	readonly myPeerIdsQuery = useLiveQuery(
		(q) =>
			q.from({ row: myPeerIdsCollection }).select(({ row }) => ({ row })),
	)
	readonly dashboardsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardsCollection })
				.where(({ row }) => not(eq(row.$id.id, '__default__')))
				.select(({ row }) => ({
					id: row.$id.id,
					name: 'name' in row ? row.name : undefined,
					icon: 'icon' in row ? row.icon : undefined,
				})),
	)
	readonly contractsQuery = useLiveQuery(
		(q) => q.from({ row: contractsCollection }).select(({ row }) => ({ row })),
	)
	readonly evmErrorsQuery = useLiveQuery(
		(q) => q.from({ row: evmErrorsCollection }).select(({ row }) => ({ row })),
	)
	readonly evmSelectorsQuery = useLiveQuery(
		(q) =>
			q.from({ row: evmSelectorsCollection }).select(({ row }) => ({ row })),
	)
	readonly evmTopicsQuery = useLiveQuery(
		(q) => q.from({ row: evmTopicsCollection }).select(({ row }) => ({ row })),
	)
	readonly farcasterConnectionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: farcasterConnectionsCollection })
				.select(({ row }) => ({ row })),
	)
	readonly socialPostSessionsQuery = useLiveQuery(
		(q) =>
			q.from({ row: socialPostSessionsCollection }).select(({ row }) => ({ row })),
	)
	readonly defaultDashboardRowQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardsCollection })
				.where(({ row }) => eq(row.$id.id, '__default__'))
				.select(({ row }) =>
					'defaultDashboardId' in row
						? { defaultDashboardId: row.defaultDashboardId }
						: { defaultDashboardId: undefined as string | undefined },
				),
	)

	items = $derived.by(() => {
		const defaultDashboardId =
			this.defaultDashboardRowQuery.data?.[0]?.defaultDashboardId ?? 'default'
		const walletsByRdns = new Map(
			(this.walletsQuery.data ?? []).map((r) => [r.row.$id.rdns, r.row]),
		)
		const connectedWalletConnections = (this.walletConnectionsQuery.data ?? [])
			.map((r) => r.row)
			.filter((row) => (row as { status?: string }).status === 'connected')
			.sort(
				(a, b) =>
					(a.transport === WalletConnectionTransport.None ? 1 : 0) -
					(b.transport === WalletConnectionTransport.None ? 1 : 0),
			)
		const myPeerIdsSet = new Set(
			(this.myPeerIdsQuery.data ?? []).map((r) => r.row.peerId),
		)
		const watchedByType = Map.groupBy(
			(this.watchedEntitiesQuery.data ?? []).map((r) =>
				deriveWatchedEntityRow(r.row as WatchedEntityStoredRow),
			),
			(row) => row.entityType,
		)
		const watchedContracts = watchedByType.get(EntityType.Contract) ?? []
		const watchedSessionRows = watchedByType.get(EntityType.Session) ?? []
		const watchedActorRows = watchedByType.get(EntityType.Actor) ?? []
		const watchedRoomRows = watchedByType.get(EntityType.Room) ?? []
		const watchedAgentTreeRows =
			watchedByType.get(EntityType.AgentChatTree) ?? []
		const watchedCoinRows = watchedByType.get(EntityType.Coin) ?? []
		const watchedNetworkRows = watchedByType.get(EntityType.Network) ?? []
		const watchedProposalRows = watchedByType.get(EntityType.Proposal) ?? []
		const watchedEvmErrorRows = watchedByType.get(EntityType.EvmError) ?? []
		const watchedEvmSelectorRows =
			watchedByType.get(EntityType.EvmSelector) ?? []
		const watchedEvmTopicRows = watchedByType.get(EntityType.EvmTopic) ?? []
		const isTestnet = this.options.isTestnet()
		const chainIdMatchesEnv = (chainId: number) =>
			networksByChainId[chainId]?.type ===
			(isTestnet ? NetworkType.Testnet : NetworkType.Mainnet)
		const exploreCoinRows = watchedCoinRows.filter((row) => {
			const c = row.entityId as { $network?: { chainId: number } }
			return c?.$network != null && chainIdMatchesEnv(c.$network.chainId)
		})
		const exploreNetworkRows = watchedNetworkRows.filter((row) =>
			chainIdMatchesEnv((row.entityId as { chainId: number }).chainId),
		)
		const exploreContractRows = watchedContracts.filter((row) =>
			chainIdMatchesEnv(
				(row.entityId as { $network: { chainId: number } }).$network.chainId,
			),
		)
		const watchedFarcasterChannelRows =
			watchedByType.get(EntityType.FarcasterChannel) ?? []
		const watchedFarcasterUserRows =
			watchedByType.get(EntityType.FarcasterUser) ?? []
		const watchedFarcasterCastRows =
			watchedByType.get(EntityType.FarcasterCast) ?? []
		const watchedSocialPostSessionRows =
			watchedByType.get(EntityType.SocialPostSession) ?? []
		const socialPostSessionsById = new Map(
			(this.socialPostSessionsQuery.data ?? []).map((r) => [r.row.$id.id, r.row]),
		)
		const socialPostSessionNavItemsFromWatched = watchedSocialPostSessionRows
			.map((row) => ({
				row,
				session: socialPostSessionsById.get(
					typeof row.entityId === 'string'
						? row.entityId
						: (row.entityId as { id: string }).id,
				),
			}))
			.sort(
				(a, b) =>
					(b.session?.updatedAt ?? 0) - (a.session?.updatedAt ?? 0),
			)
			.map(({ row, session }) => ({
				id: row.id,
				title: session
					? (session.name ?? formatSocialPostSessionPlaceholderName(session.actions))
					: row.label,
				href: row.href,
				tag: session?.status,
				icon: session
					? (socialPostActionTypeDefinitionByType as Record<string, { icon: string }>)[
							session.actions[0]?.type
						]?.icon ?? '✍️'
					: '✍️',
			}))
		const sessionsById = new Map(
			(this.sessionsQuery.data ?? []).map((r) => [r.row.$id.id, r.row]),
		)
		const sessionNavItemsFromWatched = watchedSessionRows
			.map((row) => ({
				row,
				session: sessionsById.get(
					typeof row.entityId === 'string'
						? row.entityId
						: (row.entityId as { id: string }).id,
				),
			}))
			.sort(
				(a, b) =>
					(b.session?.updatedAt ?? 0) - (a.session?.updatedAt ?? 0),
			)
			.map(({ row, session }) => ({
				id: row.id,
				title: session ? (session.name ?? formatSessionPlaceholderName(session.actions)) : row.label,
				href: row.href,
				tag: session?.status,
				icon: session
					? (actionTypeDefinitionByActionType as Record<string, { icon: string }>)[
							session.actions[0]?.type
						]?.icon ?? '📋'
					: '📋',
			}))
		const allNetworkNavItems = exploreNetworkRows.map((row) => {
			const chainId = (row.entityId as { chainId: number }).chainId
			return {
				id: row.id,
				title: row.label,
				href: row.href,
				icon: networksByChainId[chainId]?.icon ?? '🌐',
				manualWatch: true,
				children: [
					{
						id: `network-${chainId}-contracts`,
						title: 'Contracts',
						href: `${row.href}/contracts`,
						icon: '📄',
					},
					...exploreContractRows
						.filter(
							(c) =>
								c.href === `${row.href}/contracts` ||
								c.href.startsWith(`${row.href}/contract/`),
						)
						.map((c) => ({
							id: c.id,
							title: c.label,
							href: c.href,
							icon: '📜',
							manualWatch: true,
						})),
				],
			}
		})
		const accountNavItemsFromWatched = watchedActorRows.map((row) => {
			const aid = row.entityId as EntityId<EntityType.Actor>
			const conn = connectedWalletConnections.find((c) =>
				c.actors.some((a) => a.toLowerCase() === aid.address.toLowerCase()),
			)
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
				tagIcon: (
					conn
						? walletsByRdns.get(conn.$id.wallet$id.rdns) ??
							{ name: conn.$id.wallet$id.rdns, icon: undefined as string | undefined }
						: { name: 'Watching', icon: undefined as string | undefined }
				).icon,
				address: {
					network: aid.$network,
					address: aid.address,
				},
			}
		})
		const roomsById = new Map(
			(this.roomsQuery.data ?? []).map((r) => [r.row.id, r.row]),
		)
		const roomsNavItemsFromWatched = watchedRoomRows.map((row) => {
			const roomId =
				typeof row.entityId === 'string'
					? row.entityId
					: (row.entityId as { id: string }).id
			const room = roomsById.get(roomId)
			return {
				id: row.id,
				title: room?.name ?? row.label,
				href: row.href,
				manualWatch: true,
				icon: roomIdToPlaceEmoji(roomId),
			}
		})
		const agentTreesById = new Map(
			(this.agentChatTreesQuery.data ?? []).map((r) => [r.row.id, r.row]),
		)
		const agentsNavItemsFromWatched = watchedAgentTreeRows.map((row) => {
			const treeId =
				typeof row.entityId === 'string'
					? row.entityId
					: (row.entityId as { id: string }).id
			const tree = agentTreesById.get(treeId)
			return {
				id: row.id,
				title: tree?.name ?? row.label,
				href: row.href,
				manualWatch: true,
				icon: '🤖',
			}
		})
		const coinsNavItemsFromWatched = exploreCoinRows.map((row) => {
			const coinId = getCoinIdForCoinEntity(
				row.entityType,
				row.entityId as Record<string, unknown>,
			)
			const iconOverride =
				coinId === CoinId.ETH
					? this.options.iconEth
					: coinId === CoinId.USDC
						? this.options.iconUsdc
						: undefined
			return {
				id: row.id,
				title: row.label,
				href: row.href,
				manualWatch: true,
				icon:
					iconOverride ?? (coinId != null ? coinById[coinId]?.icon : undefined) ?? '🪙',
			}
		})
		const evmErrorNavItemsFromWatched = watchedEvmErrorRows.map((row) => ({
			id: row.id,
			title: row.label,
			href: row.href,
			icon: '⚠️',
			manualWatch: true,
		}))
		const evmSelectorNavItemsFromWatched = watchedEvmSelectorRows.map(
			(row) => ({
				id: row.id,
				title: row.label,
				href: row.href,
				icon: '🔖',
				manualWatch: true,
			}),
		)
		const evmTopicNavItemsFromWatched = watchedEvmTopicRows.map((row) => ({
			id: row.id,
			title: row.label,
			href: row.href,
			icon: '📋',
			manualWatch: true,
		}))
		const proposalsNavItemsFromWatched = watchedProposalRows.map((row) => ({
			id: row.id,
			title: row.label,
			href: row.href,
			manualWatch: true,
			icon: '📜' as const,
		}))
		const farcasterConnections = (
			this.farcasterConnectionsQuery.data ?? []
		).map((r) => r.row) as FarcasterConnectionRow[]
		const farcasterAccountNavItems = [...farcasterConnections]
			.sort((a, b) => b.connectedAt - a.connectedAt)
			.map((conn) => ({
				id: `farcaster-account-${conn.$id.fid}`,
				title: conn.username ? `@${conn.username}` : `@${conn.$id.fid}`,
				href: `/farcaster/user/${conn.$id.fid}`,
				tag:
					conn.transport === FarcasterConnectionTransport.Siwf
						? 'Signed in'
						: 'Watching',
				icon: conn.pfpUrl ?? '👤',
			}))
		const farcasterNavItemsFromWatched = [
			...watchedFarcasterChannelRows.map((row) => ({
				id: row.id,
				title: row.label,
				href: row.href,
				manualWatch: true,
				icon: '📺' as const,
			})),
			...watchedFarcasterUserRows.map((row) => ({
				id: row.id,
				title: row.label,
				href: row.href,
				manualWatch: true,
				icon: '👤' as const,
			})),
			...watchedFarcasterCastRows.map((row) => ({
				id: row.id,
				title: row.label,
				href: row.href,
				manualWatch: true,
				icon: '💬' as const,
			})),
		]
		const peerIdToRoomPeers = (this.roomPeersQuery.data ?? []).reduce(
			(acc, { row }) => {
				const list = acc.get(row.peerId) ?? []
				list.push(row)
				acc.set(row.peerId, list)
				return acc
			},
			new Map<string, { displayName?: string, isConnected: boolean }[]>(),
		)
		const verifiedPeerAddresses = new Set(
			(this.verificationsQuery.data ?? [])
				.filter((r) => myPeerIdsSet.has(r.row.verifierPeerId) && r.row.status === 'verified')
				.filter((v) => peerIdToRoomPeers.has(v.row.verifiedPeerId))
				.map((v) => v.row.address.toLowerCase()),
		)
		const peersNavItemsFromWatched = accountNavItemsFromWatched.filter((item) =>
			verifiedPeerAddresses.has(
				(item.address?.address ?? '').toLowerCase(),
			),
		)
		return [
			{
				id: 'dashboards',
				title: 'Dashboards',
				href: '/dashboards',
				icon: '📊',
				defaultIsOpen: true,
				children: (this.dashboardsQuery.data ?? []).map((row) => ({
					id: `dashboard-${row.id}`,
					title: row.name ?? (row.id === 'default' ? 'My Dashboard' : 'Unnamed'),
					href: `/dashboard/${row.id}`,
					icon: row.icon ?? (row.id === defaultDashboardId ? '★' : '📊'),
				})),
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
					const def = actionTypeDefinitionByActionType[actionType]
					return {
						id: def.type,
						title: def.label,
						href: `/session?template=${def.type}`,
						icon: def.icon,
					}
				}),
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
					{ id: 'settings-profiles', title: 'Profiles', href: '/settings/profiles', icon: '👤' },
					...agentsNavItemsFromWatched,
				],
				allChildren: [
					{ id: 'agents-new', title: 'New conversation', href: '/agents/new', icon: '✨' },
					{ id: 'agents-api-keys', title: 'API keys', href: '/settings/llm', icon: '🔑' },
					{ id: 'settings-profiles', title: 'Profiles', href: '/settings/profiles', icon: '👤' },
					...agentsNavItemsFromWatched,
				],
			},
			{
				id: 'social',
				title: 'Social',
				icon: '💬',
				defaultIsOpen: true,
				children: [
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
						id: 'farcaster',
						title: 'Farcaster',
						href: '/farcaster',
						icon: '🔮',
						defaultIsOpen: true,
						children: [
							{
								id: 'farcaster-accounts',
								title: 'Accounts',
								href: '/farcaster/accounts',
								icon: '👤',
								tag:
									farcasterAccountNavItems.length > 0
										? String(farcasterAccountNavItems.length)
										: undefined,
								children: farcasterAccountNavItems,
								allChildren: farcasterAccountNavItems,
							},
							{
								id: 'farcaster-channels',
								title: 'Channels',
								href: '/farcaster/channels',
								icon: '📺',
							},
							{
								id: 'farcaster-sessions',
								title: 'Cast sessions',
								href: '/farcaster/sessions',
								icon: '✍️',
								tag:
									socialPostSessionNavItemsFromWatched.length > 0
										? String(socialPostSessionNavItemsFromWatched.length)
										: undefined,
								children: [
									{
										id: 'farcaster-session-create',
										title: 'Create post',
										href: '/farcaster/session?template=CreatePost',
										icon: (socialPostActionTypeDefinitionByType as Record<string, { icon: string }>)[
											SocialPostActionType.CreatePost
										]?.icon ?? '✍️',
									},
									{
										id: 'farcaster-session-reply',
										title: 'Reply to post',
										href: '/farcaster/session?template=ReplyToPost',
										icon: (socialPostActionTypeDefinitionByType as Record<string, { icon: string }>)[
											SocialPostActionType.ReplyToPost
										]?.icon ?? '↩️',
									},
									...socialPostSessionNavItemsFromWatched,
								],
								allChildren: [
									{
										id: 'farcaster-session-create',
										title: 'Create post',
										href: '/farcaster/session?template=CreatePost',
										icon: (socialPostActionTypeDefinitionByType as Record<string, { icon: string }>)[
											SocialPostActionType.CreatePost
										]?.icon ?? '✍️',
									},
									{
										id: 'farcaster-session-reply',
										title: 'Reply to post',
										href: '/farcaster/session?template=ReplyToPost',
										icon: (socialPostActionTypeDefinitionByType as Record<string, { icon: string }>)[
											SocialPostActionType.ReplyToPost
										]?.icon ?? '↩️',
									},
									...socialPostSessionNavItemsFromWatched,
								],
							},
							{
								id: 'farcaster-casts',
								title: 'Casts',
								href: '/farcaster/casts',
								icon: '💬',
							},
							{
								id: 'farcaster-users',
								title: 'Users',
								href: '/farcaster/users',
								icon: '👤',
							},
							...farcasterNavItemsFromWatched,
						],
					},
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
					{
						id: 'proposals',
						title: 'Proposals',
						href: '/proposals',
						icon: '📜',
						defaultIsOpen: true,
						children: proposalsNavItemsFromWatched,
						allChildren: proposalsNavItemsFromWatched,
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
			{
				id: 'multiplayer',
				title: 'Multiplayer',
				icon: '🤝',
				defaultIsOpen: true,
				children: [
					{
						id: 'rooms',
						title: 'Rooms',
						href: '/rooms',
						icon: '🏘️',
						tag: watchedRoomRows.length > 0 ? String(watchedRoomRows.length) : undefined,
						children: roomsNavItemsFromWatched,
						allChildren: roomsNavItemsFromWatched,
					},
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
				],
			},
			{
				id: 'tools',
				title: 'Tools',
				icon: '🔧',
				defaultIsOpen: true,
				children: [
					{
						id: 'signatures',
						title: 'EVM Signatures',
						href: '/evm',
						icon: '✍️',
						defaultIsOpen: true,
						children: [
							{
								id: 'evm-selectors',
								title: 'Selectors',
								href: '/evm/selectors',
								icon: '🔖',
								tag:
									watchedEvmSelectorRows.length > 0
										? String(watchedEvmSelectorRows.length)
										: undefined,
								children: evmSelectorNavItemsFromWatched,
								allChildren: evmSelectorNavItemsFromWatched,
							},
							{
								id: 'evm-topics',
								title: 'Topics',
								href: '/evm/topics',
								icon: '📋',
								tag:
									watchedEvmTopicRows.length > 0
										? String(watchedEvmTopicRows.length)
										: undefined,
								children: evmTopicNavItemsFromWatched,
								allChildren: evmTopicNavItemsFromWatched,
							},
							{
								id: 'evm-errors',
								title: 'Errors',
								href: '/evm/errors',
								icon: '⚠️',
								tag:
									watchedEvmErrorRows.length > 0
										? String(watchedEvmErrorRows.length)
										: undefined,
								children: evmErrorNavItemsFromWatched,
								allChildren: evmErrorNavItemsFromWatched,
							},
						],
					},
					{
						id: 'calldata-decoder',
						title: 'Calldata decoder',
						href: '/calldata-decoder',
						icon: '🔍',
					},
				],
			},
		]
	})

	constructor(
		private readonly options: {
			isTestnet: () => boolean
			iconEth?: string
			iconUsdc?: string
		},
	) {
		$effect(() => ensureDefaultRow())
		registerGlobalLiveQueryStack(() => {
			const watched =
				(this.watchedEntitiesQuery.data ?? []).map(
					(r) => (r.row as WatchedEntityStoredRow).entityType,
				)
			const watchedTypes = new Set(watched)
			const entries: LiveQueryEntry[] = [
				{
					id: 'layout-watched',
					label: 'Watched Entities',
					query: this.watchedEntitiesQuery,
				},
				{
					id: 'layout-transactions',
					label: 'Transactions',
					query: this.recentTransactionsQuery,
				},
			]
			if (watchedTypes.has(EntityType.Session)) {
				entries.push({
					id: 'layout-sessions',
					label: 'Sessions',
					query: this.sessionsQuery,
				})
			}
			if (watchedTypes.has(EntityType.SocialPostSession)) {
				entries.push({
					id: 'layout-social-post-sessions',
					label: 'Social Post Sessions',
					query: this.socialPostSessionsQuery,
				})
			}
			if (watchedTypes.has(EntityType.Contract)) {
				entries.push({
					id: 'layout-contracts',
					label: 'Contracts',
					query: this.contractsQuery,
				})
			}
			if (watchedTypes.has(EntityType.EvmError)) {
				entries.push({
					id: 'layout-evm-errors',
					label: 'EVM errors',
					query: this.evmErrorsQuery,
				})
			}
			if (watchedTypes.has(EntityType.EvmSelector)) {
				entries.push({
					id: 'layout-evm-selectors',
					label: 'EVM selectors',
					query: this.evmSelectorsQuery,
				})
			}
			if (watchedTypes.has(EntityType.EvmTopic)) {
				entries.push({
					id: 'layout-evm-topics',
					label: 'EVM topics',
					query: this.evmTopicsQuery,
				})
			}
			if (watchedTypes.has(EntityType.Actor)) {
				entries.push({
					id: 'layout-wallet-connections',
					label: 'Wallet Connections',
					query: this.walletConnectionsQuery,
				})
				entries.push({
					id: 'layout-wallets',
					label: 'Wallets',
					query: this.walletsQuery,
				})
			}
			if (watchedTypes.has(EntityType.Room)) {
				entries.push({
					id: 'layout-rooms',
					label: 'Rooms',
					query: this.roomsQuery,
				})
			}
			if (watchedTypes.has(EntityType.AgentChatTree)) {
				entries.push({
					id: 'layout-agent-chat-trees',
					label: 'Agent Chat Trees',
					query: this.agentChatTreesQuery,
				})
			}
			if (
				watchedTypes.has(EntityType.FarcasterUser) ||
				watchedTypes.has(EntityType.FarcasterChannel) ||
				watchedTypes.has(EntityType.FarcasterCast)
			) {
				entries.push({
					id: 'layout-farcaster-connections',
					label: 'Farcaster Connections',
					query: this.farcasterConnectionsQuery,
				})
			}
			return entries
		})
	}
}

