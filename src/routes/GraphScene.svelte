<script lang="ts">
	// Types/constants
	import type { Attributes } from 'graphology-types'
	import type { DisplayData } from 'sigma/types'
	import type {
		GraphEdge,
		GraphEdgeStyle,
		GraphModel,
		GraphNode,
		GraphNodeStyle,
	} from '$/lib/graphModel.ts'
	import { GraphFramework } from '$/lib/graphModel.ts'
	import { actorAllowancesCollection } from '$/collections/ActorAllowances.ts'
	import { actorCoinsCollection } from '$/collections/ActorCoins.ts'
	import { actorsCollection } from '$/collections/Actors.ts'
	import { blocksCollection } from '$/collections/Blocks.ts'
	import { bridgeRouteItemsCollection } from '$/collections/BridgeRoutes.ts'
	import { cctpAllowanceCollection } from '$/collections/CctpAllowance.ts'
	import { cctpFeesCollection } from '$/collections/CctpFees.ts'
	import { coinsCollection } from '$/collections/Coins.ts'
	import { dashboardsCollection } from '$/collections/Dashboards.ts'
	import { networksCollection } from '$/collections/Networks.ts'
	import { partykitRoomPeersCollection } from '$/collections/PartykitRoomPeers.ts'
	import { partykitRoomsCollection } from '$/collections/PartykitRooms.ts'
	import { sharedAddressesCollection } from '$/collections/SharedAddresses.ts'
	import { siweChallengesCollection } from '$/collections/SiweChallenges.ts'
	import { storkPricesCollection } from '$/collections/StorkPrices.ts'
	import { swapQuotesCollection } from '$/collections/SwapQuotes.ts'
	import { tokenListCoinsCollection } from '$/collections/TokenListCoins.ts'
	import { sessionSimulationsCollection } from '$/collections/SessionSimulations.ts'
	import { sessionsCollection } from '$/collections/Sessions.ts'
	import { bridgeTransactionsCollection } from '$/collections/BridgeTransactions.ts'
	import { transferGraphsCollection } from '$/collections/TransferGraphs.ts'
	import { transferRequestsCollection } from '$/collections/TransferRequests.ts'
	import { uniswapPoolsCollection } from '$/collections/UniswapPools.ts'
	import { uniswapPositionsCollection } from '$/collections/UniswapPositions.ts'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { walletsCollection } from '$/collections/Wallets.ts'
	import { watchedEntitiesCollection } from '$/collections/WatchedEntities.ts'
	import { stateChannelStatesCollection } from '$/collections/StateChannelStates.ts'
	import { stateChannelsCollection } from '$/collections/StateChannels.ts'
	import { stateChannelDepositsCollection } from '$/collections/StateChannelDeposits.ts'
	import { stateChannelTransfersCollection } from '$/collections/StateChannelTransfers.ts'
	import { entitySourcesCollection } from '$/collections/_EntitySources.ts'
	import { DataSourceId } from '$/constants/data-sources.ts'
	import {
		NetworkType,
		networksByChainId,
	} from '$/constants/networks.ts'
	import {
		EntityType,
		graphSceneEntityTypes,
	} from '$/data/$EntityType.ts'
	import { SessionStatus } from '$/data/Session.ts'
	import { untrack } from 'svelte'
	import {
		buildWatchedKeys,
		isInWatchedScope,
	} from '$/lib/graphWatchedScope.ts'
	import { entityIntent } from '$/lib/intents/intentDraggable.svelte.ts'
	import { GRAPH_SCENE_MAX_PER_COLLECTION } from '$/constants/query-limits.ts'
	import { graphSceneState } from '$/state/graph-scene.svelte.ts'
	import Graph from 'graphology'
	import { formatSmallestToDecimal } from '$/lib/format.ts'
	import { stringify } from '$/lib/stringify.ts'


	// Context
	import { eq, not, useLiveQuery } from '@tanstack/svelte-db'
	import {
		useGlobalQueries,
		useLocalQueries,
		type LiveQueryEntry,
	} from '$/svelte/live-query-context.svelte.ts'
	const globalLiveQueryCtx = useGlobalQueries()
	const localLiveQueryCtx = useLocalQueries()


	// Components
	import Combobox from '$/components/Combobox.svelte'
	import G6Graph from '$/components/G6Graph.svelte'
	import Select from '$/components/Select.svelte'
	import SigmaGraphView from '$/components/SigmaGraphView.svelte'


	// Props
	let {
		defaultIsVisible = false,
		queryStack,
		globalQueryStack,
	}: {
		defaultIsVisible?: boolean
		queryStack?: LiveQueryEntry[]
		globalQueryStack?: LiveQueryEntry[],
	} = $props()


	// State
	let hoveredNode: string | undefined = $state(undefined)
	const inGraphTypeSet = new Set(graphSceneEntityTypes)
	const visibleCollections = $derived(
		new Set(
			graphSceneState.current.visibleEntities.filter((s) =>
				graphSceneEntityTypes.includes(s as (typeof graphSceneEntityTypes)[number]),
			),
		)
	)
	const hiddenEntitySources = $derived(
		new Set(graphSceneState.current.hiddenEntitySources.filter(Boolean))
	)
	const expandedCollections = $derived(
		new Set(
			(graphSceneState.current.expandedEntities ?? []).filter((s) =>
				graphSceneEntityTypes.includes(s as (typeof graphSceneEntityTypes)[number]),
			),
		)
	)
	const graphFramework = $derived(
		graphSceneState.current.graphFramework
	)
	const isVisible = $derived(
		graphSceneState.current.isVisible ?? defaultIsVisible
	)
	const graphFrameworkItems = [GraphFramework.Sigma, GraphFramework.G6] as const
	let frameworkSelection = $state<GraphFramework>(graphSceneState.current.graphFramework)
	$effect(() => {
		const persisted = graphSceneState.current.graphFramework
		untrack(() => {
			if (frameworkSelection !== persisted)
				frameworkSelection = persisted
		})
	})
	$effect(() => {
		const val = frameworkSelection
		untrack(() => {
			if (graphSceneState.current.graphFramework !== val)
				graphSceneState.current = {
					...graphSceneState.current,
					graphFramework: val,
				}
		})
	})
	let visibleEntitiesSelection = $state<string[]>([...graphSceneState.current.visibleEntities])
	let expandedEntitiesSelection = $state<string[]>([
		...(graphSceneState.current.expandedEntities ?? []),
	])
	let visibleSourceKeysSelection = $state<string[]>([])
	$effect(() => {
		const persisted = graphSceneState.current.visibleEntities
		untrack(() => {
			if (persisted.length !== visibleEntitiesSelection.length || persisted.some((v, i) => v !== visibleEntitiesSelection[i]))
				visibleEntitiesSelection = [...persisted]
		})
	})
	$effect(() => {
		const val = visibleEntitiesSelection
		untrack(() => {
			const persisted = graphSceneState.current.visibleEntities
			if (val.length !== persisted.length || val.some((v, i) => v !== persisted[i]))
				graphSceneState.current = {
					...graphSceneState.current,
					visibleEntities: [...val],
				}
		})
	})
	$effect(() => {
		const persisted = graphSceneState.current.expandedEntities ?? []
		untrack(() => {
			if (
				persisted.length !== expandedEntitiesSelection.length ||
				persisted.some((v, i) => v !== expandedEntitiesSelection[i])
			)
				expandedEntitiesSelection = [...persisted]
		})
	})
	$effect(() => {
		const val = expandedEntitiesSelection
		untrack(() => {
			const persisted = graphSceneState.current.expandedEntities ?? []
			if (
				val.length !== persisted.length ||
				val.some((v, i) => v !== persisted[i])
			)
				graphSceneState.current = {
					...graphSceneState.current,
					expandedEntities: [...val],
				}
		})
	})
	let selection = $state<{ nodes: string[]; edges: string[] }>({
		nodes: [],
		edges: [],
	})
	const selectedNodes = $derived(
		selection.nodes
	)
	const selectedEdges = $derived(
		selection.edges
	)

	const isEntitySourceVisible = (entityType: string, source: string) =>
		visibleCollections.has(entityType) &&
		!hiddenEntitySources.has(`${entityType}:${source}`)

	const skipEntity = (entityType: string, source: string | undefined) =>
		source != null && !isEntitySourceVisible(entityType, source)

	const walletsQuery = useLiveQuery((q) =>
		q.from({ row: walletsCollection }).select(({ row }) => ({ row })),
	)
	const connectionsQuery = useLiveQuery((q) =>
		q.from({ row: walletConnectionsCollection }).select(({ row }) => ({ row })),
	)
	const actorsQuery = useLiveQuery((q) =>
		q.from({ row: actorsCollection }).select(({ row }) => ({ row })),
	)
	const actorCoinsQuery = useLiveQuery((q) =>
		q.from({ row: actorCoinsCollection }).select(({ row }) => ({ row })),
	)
	const allowancesQuery = useLiveQuery((q) =>
		q.from({ row: actorAllowancesCollection }).select(({ row }) => ({ row })),
	)
	const routesQuery = useLiveQuery((q) =>
		q.from({ row: bridgeRouteItemsCollection }).select(({ row }) => ({ row })),
	)
	const txQuery = useLiveQuery((q) =>
		q.from({ row: bridgeTransactionsCollection }).select(({ row }) => ({ row })),
	)
	const blocksQuery = useLiveQuery((q) =>
		q.from({ row: blocksCollection }).select(({ row }) => ({ row })),
	)
	const networksQuery = useLiveQuery((q) =>
		q.from({ row: networksCollection }).select(({ row }) => ({ row })),
	)
	const coinsQuery = useLiveQuery((q) =>
		q.from({ row: coinsCollection }).select(({ row }) => ({ row })),
	)
	const tokenListCoinsQuery = useLiveQuery((q) =>
		q.from({ row: tokenListCoinsCollection }).select(({ row }) => ({ row })),
	)
	const storkPricesQuery = useLiveQuery((q) =>
		q.from({ row: storkPricesCollection }).select(({ row }) => ({ row })),
	)
	const swapQuotesQuery = useLiveQuery((q) =>
		q.from({ row: swapQuotesCollection }).select(({ row }) => ({ row })),
	)
	const uniswapPoolsQuery = useLiveQuery((q) =>
		q.from({ row: uniswapPoolsCollection }).select(({ row }) => ({ row })),
	)
	const uniswapPositionsQuery = useLiveQuery((q) =>
		q.from({ row: uniswapPositionsCollection }).select(({ row }) => ({ row })),
	)
	const cctpAllowanceQuery = useLiveQuery((q) =>
		q.from({ row: cctpAllowanceCollection }).select(({ row }) => ({ row })),
	)
	const cctpFeesQuery = useLiveQuery((q) =>
		q.from({ row: cctpFeesCollection }).select(({ row }) => ({ row })),
	)
	const roomsQuery = useLiveQuery((q) =>
		q.from({ row: partykitRoomsCollection }).select(({ row }) => ({ row })),
	)
	const roomPeersQuery = useLiveQuery((q) =>
		q.from({ row: partykitRoomPeersCollection }).select(({ row }) => ({ row })),
	)
	const sharedAddressesQuery = useLiveQuery((q) =>
		q.from({ row: sharedAddressesCollection }).select(({ row }) => ({ row })),
	)
	const siweChallengesQuery = useLiveQuery((q) =>
		q.from({ row: siweChallengesCollection }).select(({ row }) => ({ row })),
	)
	const SessionsQuery = useLiveQuery((q) =>
		q
			.from({ row: sessionsCollection })
			.select(({ row }) => ({ row })),
	)
	const sessionSimulationsQuery = useLiveQuery((q) =>
		q
			.from({ row: sessionSimulationsCollection })
			.select(({ row }) => ({ row })),
	)
	const transferGraphsQuery = useLiveQuery((q) =>
		q.from({ row: transferGraphsCollection }).select(({ row }) => ({ row })),
	)
	const transferRequestsQuery = useLiveQuery((q) =>
		q.from({ row: transferRequestsCollection }).select(({ row }) => ({ row })),
	)
	const dashboardsQuery = useLiveQuery((q) =>
		q
			.from({ row: dashboardsCollection })
			.where(({ row }) => not(eq(row.$id.id, '__default__')))
			.select(({ row }) => ({ row })),
	)
	const yellowChannelsQuery = useLiveQuery((q) =>
		q.from({ row: stateChannelsCollection }).select(({ row }) => ({ row })),
	)
	const stateChannelStatesQuery = useLiveQuery((q) =>
		q
			.from({ row: stateChannelStatesCollection })
			.select(({ row }) => ({ row })),
	)
	const stateChannelDepositsQuery = useLiveQuery((q) =>
		q.from({ row: stateChannelDepositsCollection }).select(({ row }) => ({ row })),
	)
	const stateChannelTransfersQuery = useLiveQuery((q) =>
		q.from({ row: stateChannelTransfersCollection }).select(({ row }) => ({ row })),
	)
	const entitySourcesQuery = useLiveQuery((q) =>
		q.from({ row: entitySourcesCollection }).select(({ row }) => ({ row })),
	)
	const watchedEntitiesQuery = useLiveQuery((q) =>
		q.from({ row: watchedEntitiesCollection }).select(({ row }) => ({ row })),
	)
	const recentTransactionsQuery = useLiveQuery((q) =>
		q.from({ row: bridgeTransactionsCollection }).select(({ row }) => ({ row })),
	)

	const entityQueryList: [EntityType, { data?: { row: unknown }[] }][] = [
		[EntityType.Wallet, walletsQuery],
		[EntityType.WalletConnection, connectionsQuery],
		[EntityType.Actor, actorsQuery],
		[EntityType.ActorCoin, actorCoinsQuery],
		[EntityType.ActorAllowance, allowancesQuery],
		[EntityType.BridgeRoute, routesQuery],
		[EntityType.Transaction, txQuery],
		[EntityType.CctpAllowance, cctpAllowanceQuery],
		[EntityType.CctpFee, cctpFeesQuery],
		[EntityType.Coin, coinsQuery],
		[EntityType.Dashboard, dashboardsQuery],
		[EntityType.Block, blocksQuery],
		[EntityType.Network, networksQuery],
		[EntityType.Room, roomsQuery],
		[EntityType.RoomPeer, roomPeersQuery],
		[EntityType.SharedAddress, sharedAddressesQuery],
		[EntityType.SiweChallenge, siweChallengesQuery],
		[EntityType.StorkPrice, storkPricesQuery],
		[EntityType.SwapQuote, swapQuotesQuery],
		[EntityType.TokenListCoin, tokenListCoinsQuery],
		[EntityType.Session, SessionsQuery],
		[EntityType.SessionSimulation, sessionSimulationsQuery],
		[EntityType.TransferGraph, transferGraphsQuery],
		[EntityType.TransferRequest, transferRequestsQuery],
		[EntityType.UniswapPool, uniswapPoolsQuery],
		[EntityType.UniswapPosition, uniswapPositionsQuery],
		[EntityType.StateChannel, yellowChannelsQuery],
		[EntityType.StateChannelState, stateChannelStatesQuery],
		[EntityType.StateChannelDeposit, stateChannelDepositsQuery],
		[EntityType.StateChannelTransfer, stateChannelTransfersQuery],
	]
	const queryByEntityType = Object.fromEntries(entityQueryList) as Partial<
		Record<EntityType, { data?: { row: unknown }[] }>
	>
	const graphQueries = entityQueryList.map(([, q]) => q)

	const entitySourceCombos = $derived(
		(entitySourcesQuery.data ?? []).map(({ row: item }) => ({
			entityType: item.entityType,
			source: item.source,
		}))
	)
	const allSourceKeys = $derived(
		entitySourceCombos.map((c) => comboKey(c.entityType, c.source))
	)
	let sourceKeysInited = false
	$effect(() => {
		if (sourceKeysInited || allSourceKeys.length === 0) return
		visibleSourceKeysSelection = allSourceKeys.filter(
			(k) => !hiddenEntitySources.has(k),
		)
		sourceKeysInited = true
	})
	$effect(() => {
		void visibleSourceKeysSelection
		void allSourceKeys
		if (!sourceKeysInited) return
		untrack(() => {
			const hidden = allSourceKeys.filter(
				(k) => !visibleSourceKeysSelection.includes(k),
			)
			const persisted = graphSceneState.current.hiddenEntitySources
			if (hidden.length !== persisted.length || hidden.some((v, i) => v !== persisted[i]))
				graphSceneState.current = {
					...graphSceneState.current,
					hiddenEntitySources: hidden,
				}
		})
	})

	// Constants (scene styles)
	type CollectionStyle = {
		color: string
		label: string
		size: number
		ring: number
		g6Type?: string
		g6Style: GraphNodeStyle
	}
	type LegendEntityTypeItem = { id: EntityType; label: string; color: string }

	const collections: Record<EntityType, CollectionStyle> = {
		[EntityType.Wallet]: {
			color: '#3b82f6',
			label: 'Wallets',
			size: 18,
			ring: 0,
			g6Type: 'image',
			g6Style: {
				shadowBlur: 14,
				shadowColor: '#60a5fa',
				labelPlacement: 'bottom',
				zIndex: 4,
			},
		},
		[EntityType.WalletConnection]: {
			color: '#22c55e',
			label: 'Sessions',
			size: 14,
			ring: 1,
			g6Type: 'circle',
			g6Style: {
				lineDash: [6, 3],
				labelPlacement: 'top',
				badge: { text: 'WS' },
				zIndex: 3,
			},
		},
		[EntityType.Actor]: {
			color: '#f59e0b',
			label: 'Accounts',
			size: 16,
			ring: 2,
			g6Type: 'circle',
			g6Style: {
				lineWidth: 2,
				labelPlacement: 'right',
				halo: true,
				haloStroke: '#fbbf24',
				haloLineWidth: 6,
			},
		},
		[EntityType.ActorNetwork]: {
			color: '#84cc16',
			label: 'Account Networks',
			size: 14,
			ring: 2.5,
			g6Type: 'circle',
			g6Style: {
				lineDash: [4, 2],
				labelPlacement: 'right',
				opacity: 0.9,
			},
		},
		[EntityType.ActorCoin]: {
			color: '#8b5cf6',
			label: 'Balances',
			size: 10,
			ring: 3,
			g6Type: 'donut',
			g6Style: {
				innerR: 0.55,
				labelPlacement: 'bottom',
				shadowBlur: 8,
				shadowColor: '#a78bfa',
			},
		},
		[EntityType.ActorAllowance]: {
			color: '#ec4899',
			label: 'Approvals',
			size: 9,
			ring: 3.5,
			g6Type: 'circle',
			g6Style: {
				lineDash: [4, 4],
				labelPlacement: 'left',
				badge: { text: 'OK' },
				opacity: 0.85,
			},
		},
		[EntityType.BridgeRoute]: {
			color: '#06b6d4',
			label: 'Routes',
			size: 12,
			ring: 4,
			g6Type: 'rect',
			g6Style: {
				radius: 6,
				labelPlacement: 'bottom',
				shadowBlur: 10,
				shadowColor: '#22d3ee',
			},
		},
		[EntityType.Transaction]: {
			color: '#ef4444',
			label: 'Transactions',
			size: 11,
			ring: 4.5,
			g6Type: 'diamond',
			g6Style: {
				labelPlacement: 'top',
				lineWidth: 2,
				opacity: 0.9,
			},
		},
		[EntityType.CctpAllowance]: {
			color: '#f97316',
			label: 'CCTP Allowance',
			size: 10,
			ring: 4.8,
			g6Type: 'rect',
			g6Style: {
				radius: 4,
				lineDash: [6, 2],
				labelPlacement: 'right',
				shadowBlur: 6,
				shadowColor: '#fdba74',
			},
		},
		[EntityType.CctpFee]: {
			color: '#facc15',
			label: 'CCTP Fees',
			size: 9,
			ring: 5,
			g6Type: 'rect',
			g6Style: {
				radius: 8,
				labelPlacement: 'left',
				opacity: 0.8,
				badge: { text: '$' },
			},
		},
		[EntityType.Coin]: {
			color: '#14b8a6',
			label: 'Coins',
			size: 10,
			ring: 5.2,
			g6Type: 'circle',
			g6Style: {
				labelPlacement: 'bottom',
				lineWidth: 1.5,
				shadowBlur: 6,
				shadowColor: '#5eead4',
			},
		},
		[EntityType.Dashboard]: {
			color: '#64748b',
			label: 'Panels',
			size: 11,
			ring: 9,
			g6Type: 'rect',
			g6Style: {
				radius: 6,
				labelPlacement: 'top',
				ports: [{ placement: 'top' }, { placement: 'bottom' }],
				opacity: 0.7,
			},
		},
		[EntityType.Block]: {
			color: '#64748b',
			label: 'Blocks',
			size: 10,
			ring: 2.8,
			g6Type: 'rect',
			g6Style: {
				radius: 4,
				labelPlacement: 'right',
				lineDash: [2, 2],
			},
		},
		[EntityType.Network]: {
			color: '#94a3b8',
			label: 'Networks',
			size: 13,
			ring: 2.5,
			g6Type: 'circle',
			g6Style: {
				labelPlacement: 'right',
				anchorPoints: [
					[0, 0.5],
					[1, 0.5],
				],
				lineDash: [2, 2],
			},
		},
		[EntityType.Room]: {
			color: '#f472b6',
			label: 'Rooms',
			size: 12,
			ring: 7,
			g6Type: 'rect',
			g6Style: {
				radius: 10,
				labelPlacement: 'bottom',
				shadowBlur: 10,
				shadowColor: '#f9a8d4',
			},
		},
		[EntityType.RoomPeer]: {
			color: '#fb7185',
			label: 'Room Peers',
			size: 9,
			ring: 7.2,
			g6Type: 'circle',
			g6Style: {
				labelPlacement: 'top',
				lineDash: [3, 3],
				opacity: 0.75,
			},
		},
		[EntityType.SharedAddress]: {
			color: '#fca5a5',
			label: 'Shared Addresses',
			size: 9,
			ring: 7.4,
			g6Type: 'circle',
			g6Style: {
				labelPlacement: 'right',
				badge: { text: 'ID' },
				shadowBlur: 6,
				shadowColor: '#fecaca',
			},
		},
		[EntityType.SiweChallenge]: {
			color: '#c084fc',
			label: 'SIWE',
			size: 9,
			ring: 7.6,
			g6Type: 'rect',
			g6Style: {
				radius: 4,
				labelPlacement: 'left',
				lineDash: [5, 3],
				opacity: 0.8,
			},
		},
		[EntityType.StorkPrice]: {
			color: '#a855f7',
			label: 'Stork Prices',
			size: 8,
			ring: 5.6,
			g6Type: 'circle',
			g6Style: {
				labelPlacement: 'right',
				shadowBlur: 8,
				shadowColor: '#d8b4fe',
				opacity: 0.75,
			},
		},
		[EntityType.SwapQuote]: {
			color: '#0ea5e9',
			label: 'Swap Quotes',
			size: 10,
			ring: 5.8,
			g6Type: 'rect',
			g6Style: {
				radius: 6,
				labelPlacement: 'bottom',
				lineWidth: 2,
				badge: { text: 'Q' },
			},
		},
		[EntityType.TokenListCoin]: {
			color: '#10b981',
			label: 'Token Lists',
			size: 9,
			ring: 5.4,
			g6Type: 'circle',
			g6Style: {
				labelPlacement: 'top',
				opacity: 0.8,
				lineDash: [2, 6],
			},
		},
		[EntityType.Session]: {
			color: '#22d3ee',
			label: 'Sessions',
			size: 12,
			ring: 6.4,
			g6Type: 'rect',
			g6Style: {
				radius: 8,
				labelPlacement: 'right',
				halo: true,
				haloStroke: '#67e8f9',
				haloLineWidth: 6,
			},
		},
		[EntityType.SessionSimulation]: {
			color: '#38bdf8',
			label: 'Simulations',
			size: 9,
			ring: 6.6,
			g6Type: 'rect',
			g6Style: {
				radius: 6,
				labelPlacement: 'left',
				lineDash: [4, 2],
				opacity: 0.8,
			},
		},
		[EntityType.SocialPostSession]: {
			color: '#a855f7',
			label: 'Social Post Sessions',
			size: 11,
			ring: 6.5,
			g6Type: 'rect',
			g6Style: {
				radius: 6,
				labelPlacement: 'right',
				opacity: 0.9,
			},
		},
		[EntityType.TransferGraph]: {
			color: '#84cc16',
			label: 'Transfer Graphs',
			size: 11,
			ring: 6.8,
			g6Type: 'rect',
			g6Style: {
				radius: 6,
				labelPlacement: 'bottom',
				shadowBlur: 8,
				shadowColor: '#bef264',
			},
		},
		[EntityType.TransferRequest]: {
			color: '#16a34a',
			label: 'Transfer Requests',
			size: 10,
			ring: 7.8,
			g6Type: 'rect',
			g6Style: {
				radius: 6,
				labelPlacement: 'top',
				badge: { text: 'TR' },
			},
		},
		[EntityType.UniswapPool]: {
			color: '#6366f1',
			label: 'Pools',
			size: 12,
			ring: 6,
			g6Type: 'rect',
			g6Style: {
				radius: 10,
				labelPlacement: 'bottom',
				lineWidth: 2,
				shadowBlur: 8,
				shadowColor: '#a5b4fc',
			},
		},
		[EntityType.UniswapPosition]: {
			color: '#8b5cf6',
			label: 'Positions',
			size: 10,
			ring: 6.2,
			g6Type: 'rect',
			g6Style: {
				radius: 4,
				labelPlacement: 'right',
				lineDash: [3, 2],
				opacity: 0.85,
			},
		},
		[EntityType.StateChannel]: {
			color: '#fbbf24',
			label: 'Yellow Channels',
			size: 12,
			ring: 8,
			g6Type: 'rect',
			g6Style: {
				radius: 10,
				labelPlacement: 'bottom',
				shadowBlur: 10,
				shadowColor: '#fde68a',
			},
		},
		[EntityType.StateChannelState]: {
			color: '#f59e0b',
			label: 'Channel States',
			size: 10,
			ring: 8.2,
			g6Type: 'rect',
			g6Style: {
				radius: 6,
				labelPlacement: 'top',
				lineDash: [5, 2],
				opacity: 0.75,
			},
		},
		[EntityType.StateChannelDeposit]: {
			color: '#fb923c',
			label: 'Deposits',
			size: 10,
			ring: 8.4,
			g6Type: 'circle',
			g6Style: {
				labelPlacement: 'right',
				badge: { text: 'D' },
				shadowBlur: 6,
				shadowColor: '#fdba74',
			},
		},
		[EntityType.StateChannelTransfer]: {
			color: '#f97316',
			label: 'Transfers',
			size: 10,
			ring: 8.6,
			g6Type: 'circle',
			g6Style: {
				labelPlacement: 'left',
				opacity: 0.85,
				lineWidth: 2,
			},
		},
		[EntityType.AgentChatTree]: {
			color: '#94a3b8',
			label: 'Agent conversations',
			size: 8,
			ring: 9,
			g6Type: 'circle',
			g6Style: { labelPlacement: 'bottom' },
		},
		[EntityType.AgentChatTurn]: {
			color: '#94a3b8',
			label: 'Chat turns',
			size: 6,
			ring: 9.2,
			g6Type: 'circle',
			g6Style: { labelPlacement: 'bottom' },
		},
		[EntityType.ChannelProposal]: {
			color: '#94a3b8',
			label: 'Channel proposals',
			size: 8,
			ring: 9.4,
			g6Type: 'circle',
			g6Style: { labelPlacement: 'bottom' },
		},
	}
	const legendEntityTypeItems = $derived(
		graphSceneEntityTypes
			.filter((et) => et in collections)
			.map((et) => ({
				id: et,
				label: collections[et].label,
				color: collections[et].color,
			}))
	)
	const expandableEntityTypeItems = $derived(
		legendEntityTypeItems.filter((x) =>
			visibleEntitiesSelection.includes(x.id),
		)
	)

	const edgeColors = {
		block: '#64748b',
		owns: '#64748b',
		connection: '#22c55e',
		balance: '#8b5cf6',
		allowance: '#ec4899',
		route: '#06b6d4',
		transaction: '#ef4444',
		network: '#94a3b8',
		coin: '#14b8a6',
		token: '#10b981',
		stork: '#a855f7',
		swap: '#0ea5e9',
		pool: '#6366f1',
		position: '#8b5cf6',
		cctp: '#f97316',
		session: '#22d3ee',
		simulation: '#38bdf8',
		room: '#f472b6',
		peer: '#fb7185',
		shared: '#fca5a5',
		siwe: '#c084fc',
		transferGraph: '#84cc16',
		transferRequest: '#16a34a',
		yellow: '#fbbf24',
		panel: '#64748b',
	}

	const edgeStyles: Record<string, GraphEdgeStyle> = {
		block: { lineDash: [2, 2], labelPlacement: 'center' },
		owns: { lineDash: [3, 3], labelPlacement: 'center' },
		connection: { lineDash: [6, 3], endArrow: true, labelPlacement: 'center' },
		balance: { lineWidth: 1.5, endArrow: true, labelPlacement: 'center' },
		allowance: { lineDash: [4, 4], endArrow: true, labelPlacement: 'center' },
		route: { lineWidth: 2, endArrow: true, labelPlacement: 'center' },
		transaction: { lineWidth: 2, endArrow: true, labelPlacement: 'center' },
		network: { lineDash: [2, 4], labelPlacement: 'center' },
		coin: { lineWidth: 1, endArrow: true, labelPlacement: 'center' },
		token: { lineDash: [2, 2], labelPlacement: 'center' },
		stork: { lineDash: [4, 2], labelPlacement: 'center' },
		swap: { lineWidth: 2, endArrow: true, labelPlacement: 'center' },
		pool: { lineWidth: 2, labelPlacement: 'center' },
		position: { lineDash: [5, 3], labelPlacement: 'center' },
		cctp: { lineDash: [6, 2], labelPlacement: 'center' },
		session: { lineWidth: 2, endArrow: true, labelPlacement: 'center' },
		simulation: { lineDash: [4, 2], labelPlacement: 'center' },
		room: { lineWidth: 1.5, endArrow: true, labelPlacement: 'center' },
		peer: { lineDash: [3, 3], labelPlacement: 'center' },
		shared: { lineDash: [2, 2], labelPlacement: 'center' },
		siwe: { lineDash: [4, 2], labelPlacement: 'center' },
		transferGraph: { lineWidth: 1.5, labelPlacement: 'center' },
		transferRequest: { lineDash: [6, 3], labelPlacement: 'center' },
		yellow: { lineWidth: 2, endArrow: true, labelPlacement: 'center' },
		panel: { lineDash: [2, 2], labelPlacement: 'center' },
	}

	// Functions
	const comboKey = (entityType: string, source: string) =>
		`${entityType}:${source}`
	const normalizeStatus = (status?: string) => status?.toLowerCase() ?? ''
	const toStatusBadge = (status?: string) => {
		const n = normalizeStatus(status)
		if (!n) return null
		const map: Record<string, string> = {
			pending: 'PEND',
			completed: 'DONE',
			failed: 'FAIL',
			finalized: 'DONE',
			open: 'OPEN',
			closed: 'CLOSE',
		}
		return map[n] ?? (status ?? '').slice(0, 4).toUpperCase()
	}
	const statusLineDash = (status?: string) => {
		const n = normalizeStatus(status)
		return n === 'pending' ? [4, 3] : n === 'failed' ? [2, 2] : n === 'closed' ? [6, 3] : undefined
	}
	const statusOpacity = (status?: string) => {
		const n = normalizeStatus(status)
		return n === 'failed' ? 0.6 : n === 'pending' ? 0.85 : n === 'closed' ? 0.7 : undefined
	}

	const parseNumber = (value: unknown): number | null => {
		if (typeof value === 'number') return value
		if (typeof value === 'string') {
			const parsed = Number(value)
			return Number.isFinite(parsed) ? parsed : null
		}
		return null
	}
	const isRecord = (value: unknown): value is Record<string, unknown> =>
		typeof value === 'object' && value !== null

	const getChainName = (chainId: number) =>
		Object.values(networksByChainId).find((entry) => entry?.chainId === chainId)
			?.name ?? `Chain ${chainId}`

	const toNodeId = (prefix: string, id: unknown) => `${prefix}:${stringify(id)}`

	const toIntentPayload = (type: EntityType, id: Record<string, unknown>) =>
		entityIntent(type, id, 'graph')

	const baseNode = (
		entityType: EntityType,
		pos: { x: number; y: number },
		overrides: Partial<GraphNode> & { id: string },
	): GraphNode => ({
		...pos,
		size: collections[entityType].size,
		color: collections[entityType].color,
		collection: entityType,
		g6Type: collections[entityType].g6Type,
		g6Style: collections[entityType].g6Style,
		...overrides,
	})

	// (Derived)
	const counts = $derived(
		Object.fromEntries(
			(Object.keys(collections) as EntityType[]).map((t) => [
				t,
				queryByEntityType[t]?.data?.length ?? 0,
			]),
		) as Record<EntityType, number>
	)

	// (Derived)
	const graphModel = $derived.by(() => {
		if (!isVisible) return null

		const watchedKeys = buildWatchedKeys(watchedEntitiesQuery.data ?? [])
		const take = <T,>(a: T[] | undefined) =>
			(a ?? []).slice(0, GRAPH_SCENE_MAX_PER_COLLECTION)
		const rowsForType = <T extends { row: Record<string, unknown> }>(
			entityType: EntityType,
			data: T[] | undefined,
		) => {
			const taken = take(data)
			if (expandedCollections.has(entityType)) return taken
			return taken.filter(({ row: item }) =>
				isInWatchedScope(entityType, item, watchedKeys),
			)
		}
		const g = new Graph({ multi: true, allowSelfLoops: true })
		const nodes: GraphNode[] = []
		const edges: GraphEdge[] = []
		let edgeIndex = 0

		const addNode = (node: GraphNode) => {
			const { id, ...attrs } = node
			g.addNode(id, attrs)
			nodes.push(node)
		}

		const addEdge = (edge: GraphEdge) => {
			const { id, source, target, ...attrs } = edge
			g.addEdgeWithKey(id, source, target, attrs)
			edges.push(edge)
		}
		type EdgeRelation = keyof typeof edgeColors
		const addRelationEdge = (
			relation: EdgeRelation,
			source: string,
			target: string,
			opts?: Partial<GraphEdge>,
		) =>
			addEdge({
				id: `edge:${edgeIndex++}`,
				source,
				target,
				size: 1.5,
				color: edgeColors[relation],
				type: 'curvedArrow',
				relation,
				g6Style: edgeStyles[relation],
				...opts,
			})

		// Position nodes in rings by collection type
		const positionInRing = (ring: number, index: number, total: number) => {
			const baseRadius = 35 + ring * 30
			const angle = (index / Math.max(total, 1)) * Math.PI * 2 + ring * 0.3
			return {
				x: Math.cos(angle) * baseRadius + (((index * 7 + ring * 13) % 17) / 17 - 0.5) * 8,
				y: Math.sin(angle) * baseRadius + (((index * 11 + ring * 23) % 19) / 19 - 0.5) * 8,
			}
		}

		// Add wallet nodes (center)
		if (visibleCollections.has(EntityType.Wallet)) {
			const wallets = rowsForType(EntityType.Wallet, walletsQuery.data)
			wallets.forEach(({ row: wallet }, i) => {
				if (skipEntity(EntityType.Wallet, undefined)) return
				const rdns = wallet.$id?.rdns
				if (!rdns) return
				const pos = positionInRing(
					collections[EntityType.Wallet].ring,
					i,
					wallets.length,
				)
				addNode(
					baseNode(EntityType.Wallet, pos, {
						id: `wallet:${rdns}`,
						label: wallet.name,
						type: wallet.icon ? 'image' : 'circle',
						image: wallet.icon || undefined,
						g6Type: wallet.icon ? 'image' : collections[EntityType.Wallet].g6Type,
						details: { rdns: wallet.rdns },
					}),
				)
			})
		}

		// Add connection nodes
		if (visibleCollections.has(EntityType.WalletConnection)) {
			const connections = rowsForType(
				EntityType.WalletConnection,
				connectionsQuery.data,
			)
			connections.forEach(({ row: conn }, i) => {
				if (skipEntity(EntityType.WalletConnection, undefined)) return
				const rdns = conn.$id?.wallet$id?.rdns
				if (!rdns) return
				const connId = `connection:${rdns}`
				if (g.hasNode(connId)) return
				const pos = positionInRing(
					collections[EntityType.WalletConnection].ring,
					i,
					connections.length,
				)
				const statusColor = (
					conn.status === 'connected'
						? '#22c55e'
						: conn.status === 'error'
							? '#ef4444'
							: '#f59e0b'
				)
				const chainName = conn.chainId ? getChainName(conn.chainId) : null
				addNode({
					id: connId,
					label:
						conn.status === 'connected' ?
							`${conn.actors.length} acct${conn.actors.length !== 1 ? 's' : ''}${chainName ? ` · ${chainName}` : ''}`
							: conn.status,
					...pos,
					size: collections[EntityType.WalletConnection].size,
					color: statusColor,
					type: 'circle',
					collection: EntityType.WalletConnection,
					g6Type: collections[EntityType.WalletConnection].g6Type,
					g6Style: {
						...collections[EntityType.WalletConnection].g6Style,
						badge: {
							text:
								conn.status === 'connected'
									? 'ON'
									: conn.status === 'error'
										? 'ERR'
										: 'OFF',
						},
					},
					disabled: conn.status === 'error',
					details: {
						status: conn.status,
						chainId: conn.chainId,
						actors: conn.actors.length,
					},
				})
				if (visibleCollections.has(EntityType.Wallet)) {
					const walletId = `wallet:${rdns}`
					if (g.hasNode(walletId)) {
						addEdge({
							id: `edge:${edgeIndex++}`,
							source: walletId,
							target: connId,
							size: 2,
							color: edgeColors.connection,
							type: 'curvedArrow',
							relation: 'connection',
							g6Style: edgeStyles.connection,
						})
					}
				}
			})
		}

		// Add actor nodes
		if (visibleCollections.has(EntityType.Actor)) {
			const actors = rowsForType(EntityType.Actor, actorsQuery.data)
			const connections = rowsForType(
				EntityType.WalletConnection,
				connectionsQuery.data,
			)
			actors.forEach(({ row: actor }, i) => {
				if (skipEntity(EntityType.Actor, actor.$source)) return
				const actorId = `actor:${actor.$id.$network.chainId}:${actor.$id.address}`
				if (g.hasNode(actorId)) return
				const pos = positionInRing(
					collections[EntityType.Actor].ring,
					i,
					actors.length,
				)
				const chainName = getChainName(actor.$id.$network.chainId)
				addNode(
					baseNode(EntityType.Actor, pos, {
						id: actorId,
						label: `${actor.$id.address.slice(0, 6)}…${actor.$id.address.slice(-4)}`,
						type: 'circle',
						intent: toIntentPayload(EntityType.Actor, actor.$id),
						details: {
							address: actor.$id.address,
							chain: chainName,
							chainId: actor.$id.$network.chainId,
						},
					}),
				)
				// Connect actor to connection
				if (visibleCollections.has(EntityType.WalletConnection)) {
					for (const { row: conn } of connections) {
						if (conn.actors.includes(actor.$id.address)) {
							const connRdns = conn.$id?.wallet$id?.rdns
							if (connRdns && g.hasNode(`connection:${connRdns}`)) {
								addEdge({
									id: `edge:${edgeIndex++}`,
									source: `connection:${connRdns}`,
									target: actorId,
									size: 1.5,
									color: edgeColors.owns,
									type: 'curvedArrow',
									relation: 'owns',
									g6Style: edgeStyles.owns,
								})
							}
						}
					}
				}
			})
		}

		// Add coin balance nodes
		if (visibleCollections.has(EntityType.ActorCoin)) {
			const coins = rowsForType(EntityType.ActorCoin, actorCoinsQuery.data)
			coins.forEach(({ row: coin }, i) => {
				if (skipEntity(EntityType.ActorCoin, coin.$source)) return
				const coinId = `coin:${coin.$id.$actor.$network.chainId}:${coin.$id.$actor.address}:${coin.$id.$coin.address}`
				if (g.hasNode(coinId)) return
				const pos = positionInRing(
					collections[EntityType.ActorCoin].ring,
					i,
					coins.length,
				)
				const hasBalance = coin.balance > 0n
				const chainName = getChainName(coin.$id.$actor.$network.chainId)
				const balanceStr = hasBalance
					? formatSmallestToDecimal(coin.balance, coin.decimals, 2)
					: '0'
				addNode({
					id: coinId,
					label: `${balanceStr} ${coin.symbol}`,
					...pos,
					size: hasBalance
						? collections[EntityType.ActorCoin].size + 3
						: collections[EntityType.ActorCoin].size,
					color: hasBalance
						? collections[EntityType.ActorCoin].color
						: `${collections[EntityType.ActorCoin].color}55`,
					type: 'circle',
					collection: EntityType.ActorCoin,
					g6Type: collections[EntityType.ActorCoin].g6Type,
					g6Style: {
						...collections[EntityType.ActorCoin].g6Style,
						opacity: hasBalance ? 1 : 0.6,
						lineDash: hasBalance ? undefined : [3, 3],
					},
					intent: toIntentPayload(EntityType.ActorCoin, coin.$id),
					disabled: !hasBalance,
					details: {
						symbol: coin.symbol,
						balance: balanceStr,
						chain: chainName,
						hasBalance,
					},
				})
				if (visibleCollections.has(EntityType.Actor)) {
					const actorId = `actor:${coin.$id.$actor.$network.chainId}:${coin.$id.$actor.address}`
					if (g.hasNode(actorId)) {
						addRelationEdge('balance', actorId, coinId, {
							size: hasBalance ? 1.5 : 0.5,
							color: hasBalance
								? edgeColors.balance
								: `${edgeColors.balance}33`,
							disabled: !hasBalance,
						})
					}
				}
			})
		}

		// Add allowance nodes
		if (visibleCollections.has(EntityType.ActorAllowance)) {
			const allowances = rowsForType(
				EntityType.ActorAllowance,
				allowancesQuery.data,
			)
			allowances.forEach(({ row: allowance }, i) => {
				if (skipEntity(EntityType.ActorAllowance, allowance.$source)) return
				const allowanceId = `allowance:${allowance.$id.$actorCoin.$actor.$network.chainId}:${allowance.$id.$actorCoin.$actor.address}:${allowance.$id.$actorCoin.$coin.address}:${allowance.$id.$spender.address}`
				if (g.hasNode(allowanceId)) return
				const pos = positionInRing(
					collections[EntityType.ActorAllowance].ring,
					i,
					allowances.length,
				)
				const hasAllowance = allowance.allowance > 0n
				const chainName = getChainName(allowance.$id.$actorCoin.$actor.$network.chainId)
				addNode({
					id: allowanceId,
					label: hasAllowance ? '✓ Approved' : '○ Pending',
					...pos,
					size: hasAllowance
						? collections[EntityType.ActorAllowance].size + 2
						: collections[EntityType.ActorAllowance].size,
					color: hasAllowance
						? collections[EntityType.ActorAllowance].color
						: `${collections[EntityType.ActorAllowance].color}55`,
					type: 'circle',
					collection: EntityType.ActorAllowance,
					g6Type: collections[EntityType.ActorAllowance].g6Type,
					g6Style: {
						...collections[EntityType.ActorAllowance].g6Style,
						badge: { text: hasAllowance ? 'OK' : 'WAIT' },
						lineDash: hasAllowance ? undefined : [5, 3],
					},
					disabled: !hasAllowance,
					details: {
						chain: chainName,
						approved: hasAllowance,
						spender: allowance.$id.$spender.address.slice(0, 10) + '…',
					},
				})
				if (visibleCollections.has(EntityType.ActorCoin)) {
					const coinId = `coin:${allowance.$id.$actorCoin.$actor.$network.chainId}:${allowance.$id.$actorCoin.$actor.address}:${allowance.$id.$actorCoin.$coin.address}`
					if (g.hasNode(coinId)) {
						addRelationEdge('allowance', coinId, allowanceId, {
							size: hasAllowance ? 1 : 0.5,
							color: hasAllowance
								? edgeColors.allowance
								: `${edgeColors.allowance}33`,
							disabled: !hasAllowance,
						})
					}
				}
			})
		}

		// Add network nodes
		if (visibleCollections.has(EntityType.Network)) {
			const networks = rowsForType(EntityType.Network, networksQuery.data)
			networks.forEach(({ row: network }, i) => {
				if (skipEntity(EntityType.Network, network.$source)) return
				const networkId = `network:${network.$id.chainId}`
				if (g.hasNode(networkId)) return
				const pos = positionInRing(
					collections[EntityType.Network].ring,
					i,
					networks.length,
				)
				addNode(
					baseNode(EntityType.Network, pos, {
						id: networkId,
						label: network.name,
						type: 'circle',
						g6Style: {
							...collections[EntityType.Network].g6Style,
							badge: {
								text: network.type === NetworkType.Testnet ? 'TEST' : 'MAIN',
							},
							lineDash: network.type === NetworkType.Testnet ? [3, 3] : undefined,
							opacity: network.type === NetworkType.Testnet ? 0.7 : 1,
						},
						details: {
							chainId: network.$id.chainId,
							type: network.type,
							name: network.name,
							caip2: networksByChainId[network.$id.chainId]?.caip2 ?? `eip155:${network.$id.chainId}`,
							slug: networksByChainId[network.$id.chainId]?.slug ?? network.name.toLowerCase().replace(/\s+/g, '-'),
						},
					}),
				)
			})
		}

		if (visibleCollections.has(EntityType.Block)) {
			const blocks = rowsForType(EntityType.Block, blocksQuery.data)
			blocks.forEach(({ row: block }, i) => {
				if (skipEntity(EntityType.Block, block.$source)) return
				const blockId = `block:${block.$id.$network.chainId}:${block.$id.blockNumber}`
				if (g.hasNode(blockId)) return
				const pos = positionInRing(
					collections[EntityType.Block].ring,
					i,
					blocks.length,
				)
				addNode({
					id: blockId,
					label: `#${block.$id.blockNumber}`,
					...pos,
					size: collections[EntityType.Block].size,
					color: collections[EntityType.Block].color,
					type: 'rect',
					collection: EntityType.Block,
					g6Type: collections[EntityType.Block].g6Type,
					g6Style: collections[EntityType.Block].g6Style,
					details: {
						chainId: block.$id.$network.chainId,
						blockNumber: block.$id.blockNumber,
						timestamp: block.timestamp,
						networkSlug:
							networksByChainId[block.$id.$network.chainId]?.slug ?? '',
					},
				})
			})
			blocks.forEach(({ row: block }) => {
				const blockId = `block:${block.$id.$network.chainId}:${block.$id.blockNumber}`
				const networkId = `network:${block.$id.$network.chainId}`
				if (g.hasNode(networkId)) {
					addEdge({
						id: `edge:${edgeIndex++}`,
						source: networkId,
						target: blockId,
						size: 1,
						color: edgeColors.coin,
						type: 'line',
						relation: 'block',
						g6Style: edgeStyles.coin,
					})
				}
			})
		}

		// Add route nodes
		if (visibleCollections.has(EntityType.BridgeRoute)) {
			const routes = rowsForType(
				EntityType.BridgeRoute,
				routesQuery.data,
			)
			routes.forEach(({ row: route }, i) => {
				if (skipEntity(EntityType.BridgeRoute, route.$source)) return
				const routeId = `route:${route.$id.routeId}`
				if (g.hasNode(routeId)) return
				const pos = positionInRing(
					collections[EntityType.BridgeRoute].ring,
					i,
					routes.length,
				)
				const fromChain = getChainName(route.fromChainId)
				const toChain = getChainName(route.toChainId)
				addNode({
					id: routeId,
					label: `${formatSmallestToDecimal(route.toAmount, 6, 4)} USDC`,
					...pos,
					size: collections[EntityType.BridgeRoute].size,
					color: collections[EntityType.BridgeRoute].color,
					type: 'circle',
					collection: EntityType.BridgeRoute,
					g6Type: collections[EntityType.BridgeRoute].g6Type,
					g6Style: {
						...collections[EntityType.BridgeRoute].g6Style,
						badge: {
							text:
								route.tags
									.find((tag) => tag.toLowerCase().includes('fast'))
									?.slice(0, 4)
									.toUpperCase() ??
								route.tags
									.find((tag) => tag.toLowerCase().includes('cheap'))
									?.slice(0, 4)
									.toUpperCase() ??
								route.tags[0]?.slice(0, 4).toUpperCase() ??
								'ROUT',
						},
					},
					details: {
						from: fromChain,
						to: toChain,
						tools: [...new Set(route.steps.map((step) => step.toolName))].join(
							' → ',
						),
						duration: `${Math.ceil(route.estimatedDurationSeconds / 60)}m`,
						tags: route.tags.join(', '),
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					const fromNetworkId = `network:${route.fromChainId}`
					const toNetworkId = `network:${route.toChainId}`
					if (g.hasNode(fromNetworkId)) {
						addRelationEdge('route', fromNetworkId, routeId)
					}
					if (g.hasNode(toNetworkId)) {
						addRelationEdge('route', routeId, toNetworkId)
					}
				}
			})
		}

		// Add transaction nodes
		if (visibleCollections.has(EntityType.Transaction)) {
			const txs = rowsForType(EntityType.Transaction, txQuery.data)
			txs.forEach(({ row: tx }, i) => {
				if (skipEntity(EntityType.Transaction, undefined)) return
				const txId = `tx:${tx.$id.sourceTxHash}`
				if (g.hasNode(txId)) return
				const pos = positionInRing(
					collections[EntityType.Transaction].ring,
					i,
					txs.length,
				)
				const statusColors = {
					pending: '#f59e0b',
					completed: '#22c55e',
					failed: '#ef4444',
				}
				const statusIcon = { pending: '⏳', completed: '✓', failed: '✗' }
				const fromChain = getChainName(tx.fromChainId)
				const toChain = getChainName(tx.toChainId)
				addNode({
					id: txId,
					label: `${statusIcon[tx.status]} ${fromChain} → ${toChain}`,
					...pos,
					size: collections[EntityType.Transaction].size,
					color:
						statusColors[tx.status] ??
						collections[EntityType.Transaction].color,
					type: 'circle',
					collection: EntityType.Transaction,
					g6Type: collections[EntityType.Transaction].g6Type,
					g6Style: {
						...collections[EntityType.Transaction].g6Style,
						badge: { text: toStatusBadge(tx.status) ?? 'TX' },
						lineDash: statusLineDash(tx.status),
						opacity: statusOpacity(tx.status),
					},
					disabled: tx.status === 'failed',
					details: {
						status: tx.status,
						from: fromChain,
						to: toChain,
						hash: tx.$id.sourceTxHash.slice(0, 10) + '…',
					},
				})
				if (visibleCollections.has(EntityType.Actor)) {
					const actorId = `actor:${tx.fromChainId}:${tx.$id.address}`
					if (g.hasNode(actorId)) {
						addEdge({
							id: `edge:${edgeIndex++}`,
							source: actorId,
							target: txId,
							size: 1.5,
							color: edgeColors.transaction,
							type: 'curvedArrow',
							relation: 'transaction',
							g6Style: edgeStyles.transaction,
							disabled: tx.status === 'failed',
						})
					}
				}
			})
		}

		// Add coin nodes
		if (visibleCollections.has(EntityType.Coin)) {
			const coins = rowsForType(EntityType.Coin, coinsQuery.data)
			coins.forEach(({ row: coin }, i) => {
				if (skipEntity(EntityType.Coin, coin.$source)) return
				const coinId = `erc20:${coin.$id.$network.chainId}:${coin.$id.address}`
				if (g.hasNode(coinId)) return
				const pos = positionInRing(
					collections[EntityType.Coin].ring,
					i,
					coins.length,
				)
				addNode(
					baseNode(EntityType.Coin, pos, {
						id: coinId,
						label: coin.symbol,
						type: 'circle',
						intent: toIntentPayload(EntityType.Coin, coin.$id),
						details: {
							address: coin.$id.address,
							chainId: coin.$id.$network.chainId,
							symbol: coin.symbol,
						},
					}),
				)
				if (visibleCollections.has(EntityType.Network)) {
					const networkId = `network:${coin.$id.$network.chainId}`
					if (g.hasNode(networkId)) {
						addRelationEdge('coin', networkId, coinId, {
							size: 1,
							type: 'line',
						})
					}
				}
			})
		}

		// Add token list coin nodes
		if (visibleCollections.has(EntityType.TokenListCoin)) {
			const tokens = rowsForType(
				EntityType.TokenListCoin,
				tokenListCoinsQuery.data,
			)
			tokens.forEach(({ row: token }, i) => {
				if (skipEntity(EntityType.TokenListCoin, token.$source)) return
				const tokenId = `token:${token.$id.$network.chainId}:${token.$id.address}`
				if (g.hasNode(tokenId)) return
				const pos = positionInRing(
					collections[EntityType.TokenListCoin].ring,
					i,
					tokens.length,
				)
				addNode(
					baseNode(EntityType.TokenListCoin, pos, {
						id: tokenId,
						label: token.symbol,
						type: 'circle',
						intent: toIntentPayload(EntityType.TokenListCoin, token.$id),
						details: {
							address: token.$id.address,
							chainId: token.$id.$network.chainId,
							symbol: token.symbol,
						},
					}),
				)
				if (visibleCollections.has(EntityType.Network)) {
					const networkId = `network:${token.$id.$network.chainId}`
					if (g.hasNode(networkId)) {
						addRelationEdge('token', networkId, tokenId, {
							size: 1,
							type: 'line',
						})
					}
				}
			})
		}

		// Add stork price nodes
		if (visibleCollections.has(EntityType.StorkPrice)) {
			const prices = rowsForType(
				EntityType.StorkPrice,
				storkPricesQuery.data,
			)
			prices.forEach(({ row: price }, i) => {
				if (skipEntity(EntityType.StorkPrice, price.$source)) return
				const priceId = toNodeId('stork', price.$id)
				if (g.hasNode(priceId)) return
				const pos = positionInRing(
					collections[EntityType.StorkPrice].ring,
					i,
					prices.length,
				)
				addNode({
					id: priceId,
					label:
						price.assetId.length > 10 ? price.assetId.slice(0, 10) : price.assetId,
					...pos,
					size: collections[EntityType.StorkPrice].size,
					color: collections[EntityType.StorkPrice].color,
					type: 'circle',
					collection: EntityType.StorkPrice,
					g6Type: collections[EntityType.StorkPrice].g6Type,
					g6Style: collections[EntityType.StorkPrice].g6Style,
					disabled: price.isLoading || price.error !== null,
					details: {
						assetId: price.assetId,
						transport: price.transport,
						chainId: price.$id.$network?.chainId ?? null,
						price: price.price.toString(),
					},
				})
				if (visibleCollections.has(EntityType.Network) && price.$id.$network?.chainId) {
					const networkId = `network:${price.$id.$network.chainId}`
					if (g.hasNode(networkId)) {
						addRelationEdge('stork', networkId, priceId, {
							size: 1,
							type: 'line',
							disabled: price.isLoading || price.error !== null,
						})
					}
				}
			})
		}

		// Add swap quote nodes
		if (visibleCollections.has(EntityType.SwapQuote)) {
			const quotes = rowsForType(
				EntityType.SwapQuote,
				swapQuotesQuery.data,
			)
			quotes.forEach(({ row: quote }, i) => {
				if (skipEntity(EntityType.SwapQuote, quote.$source)) return
				const quoteId = `swap:${quote.id}`
				if (g.hasNode(quoteId)) return
				const pos = positionInRing(
					collections[EntityType.SwapQuote].ring,
					i,
					quotes.length,
				)
				const priceImpact = parseNumber(quote.priceImpact)
				addNode({
					id: quoteId,
					label: `${quote.tokenIn.slice(0, 6)}→${quote.tokenOut.slice(0, 6)}`,
					...pos,
					size: collections[EntityType.SwapQuote].size,
					color: collections[EntityType.SwapQuote].color,
					type: 'rect',
					collection: EntityType.SwapQuote,
					g6Type: collections[EntityType.SwapQuote].g6Type,
					g6Style: {
						...collections[EntityType.SwapQuote].g6Style,
						badge:
							priceImpact !== null && priceImpact >= 0.02 ?
								{ text: 'HI' }
								: priceImpact !== null && priceImpact >= 0.01 ?
									{ text: 'MED' }
									: undefined,
						lineDash:
							priceImpact !== null && priceImpact >= 0.02 ? [4, 2] : undefined,
					},
					details: {
						chainId: quote.chainId,
						priceImpact: quote.priceImpact,
						tokenIn: quote.tokenIn,
						tokenOut: quote.tokenOut,
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					const networkId = `network:${quote.chainId}`
					if (g.hasNode(networkId)) {
						addEdge({
							id: `edge:${edgeIndex++}`,
							source: networkId,
							target: quoteId,
							size: 1.5,
							color: edgeColors.swap,
							type: 'curvedArrow',
							relation: 'swap',
							g6Style: edgeStyles.swap,
						})
					}
				}
			})
		}

		// Add uniswap pool nodes
		if (visibleCollections.has(EntityType.UniswapPool)) {
			const pools = rowsForType(
				EntityType.UniswapPool,
				uniswapPoolsQuery.data,
			)
			pools.forEach(({ row: pool }, i) => {
				if (skipEntity(EntityType.UniswapPool, pool.$source)) return
				const poolId = `pool:${pool.$id.id}`
				if (g.hasNode(poolId)) return
				const pos = positionInRing(
					collections[EntityType.UniswapPool].ring,
					i,
					pools.length,
				)
				addNode({
					id: poolId,
					label: `${pool.token0.slice(0, 6)} / ${pool.token1.slice(0, 6)}`,
					...pos,
					size: collections[EntityType.UniswapPool].size,
					color: collections[EntityType.UniswapPool].color,
					type: 'rect',
					collection: EntityType.UniswapPool,
					g6Type: collections[EntityType.UniswapPool].g6Type,
					g6Style: {
						...collections[EntityType.UniswapPool].g6Style,
						badge:
							typeof pool.fee === 'number' ?
								{ text: `${(pool.fee / 10000).toFixed(2)}%` }
								: undefined,
					},
					details: {
						chainId: pool.$id.chainId,
						fee: pool.fee,
						hooks: pool.hooks,
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					const networkId = `network:${pool.$id.chainId}`
					if (g.hasNode(networkId)) {
						addRelationEdge('pool', networkId, poolId, {
							size: 1.5,
							type: 'line',
						})
					}
				}
			})
		}

		// Add uniswap position nodes
		if (visibleCollections.has(EntityType.UniswapPosition)) {
			const positions = rowsForType(
				EntityType.UniswapPosition,
				uniswapPositionsQuery.data,
			)
			positions.forEach(({ row: position }, i) => {
				if (skipEntity(EntityType.UniswapPosition, position.$source)) return
				const positionId = `position:${position.$id.id}`
				if (g.hasNode(positionId)) return
				const pos = positionInRing(
					collections[EntityType.UniswapPosition].ring,
					i,
					positions.length,
				)
				addNode({
					id: positionId,
					label: `Pos ${position.owner.slice(0, 6)}…`,
					...pos,
					size: collections[EntityType.UniswapPosition].size,
					color: collections[EntityType.UniswapPosition].color,
					type: 'rect',
					collection: EntityType.UniswapPosition,
					g6Type: collections[EntityType.UniswapPosition].g6Type,
					g6Style: collections[EntityType.UniswapPosition].g6Style,
					details: {
						chainId: position.$id.chainId,
						poolId: position.poolId,
						owner: position.owner,
					},
				})
				const poolId = `pool:${position.poolId}`
				if (g.hasNode(poolId)) {
					addRelationEdge('position', poolId, positionId, { size: 1.2 })
				}
			})
		}

		// Add CCTP allowance nodes
		if (visibleCollections.has(EntityType.CctpAllowance)) {
			const allowances = rowsForType(
				EntityType.CctpAllowance,
				cctpAllowanceQuery.data,
			)
			allowances.forEach(({ row: cctpAllowance }, i) => {
				if (skipEntity(EntityType.CctpAllowance, cctpAllowance.$source)) return
				const allowanceId = toNodeId('cctp-allowance', cctpAllowance.$id)
				if (g.hasNode(allowanceId)) return
				const pos = positionInRing(
					collections[EntityType.CctpAllowance].ring,
					i,
					allowances.length,
				)
				addNode({
					id: allowanceId,
					label:
						cctpAllowance.allowance === null
							? 'Allowance n/a'
							: `Allowance ${cctpAllowance.allowance}`,
					...pos,
					size: collections[EntityType.CctpAllowance].size,
					color: collections[EntityType.CctpAllowance].color,
					type: 'rect',
					collection: EntityType.CctpAllowance,
					g6Type: collections[EntityType.CctpAllowance].g6Type,
					g6Style: collections[EntityType.CctpAllowance].g6Style,
					disabled: cctpAllowance.isLoading || cctpAllowance.error !== null,
					details: {
						apiHost: cctpAllowance.$id.apiHost,
						lastUpdated: cctpAllowance.lastUpdated,
						error: cctpAllowance.error,
					},
				})
			})
		}

		// Add CCTP fee nodes
		if (visibleCollections.has(EntityType.CctpFee)) {
			const fees = rowsForType(EntityType.CctpFee, cctpFeesQuery.data)
			fees.forEach(({ row: fee }, i) => {
				if (skipEntity(EntityType.CctpFee, fee.$source)) return
				const feeId = toNodeId('cctp-fee', fee.$id)
				if (g.hasNode(feeId)) return
				const pos = positionInRing(
					collections[EntityType.CctpFee].ring,
					i,
					fees.length,
				)
				addNode({
					id: feeId,
					label: `${fee.$id.fromDomain}→${fee.$id.toDomain}`,
					...pos,
					size: collections[EntityType.CctpFee].size,
					color: collections[EntityType.CctpFee].color,
					type: 'rect',
					collection: EntityType.CctpFee,
					g6Type: collections[EntityType.CctpFee].g6Type,
					g6Style: collections[EntityType.CctpFee].g6Style,
					disabled: fee.isLoading || fee.error !== null,
					details: {
						apiHost: fee.$id.apiHost,
						rows: fee.rows.length,
						error: fee.error,
					},
				})
			})
		}

		// Add transaction session nodes
		if (visibleCollections.has(EntityType.Session)) {
			const sessions = rowsForType(EntityType.Session, SessionsQuery.data)
			sessions.forEach(({ row: session }, i) => {
				if (skipEntity(EntityType.Session, undefined)) return
				const sessionId = `session:${session.$id.id}`
				if (g.hasNode(sessionId)) return
				const pos = positionInRing(
					collections[EntityType.Session].ring,
					i,
					sessions.length,
				)
				addNode({
					id: sessionId,
					label: `Session ${session.$id.id.slice(0, 6)}`,
					...pos,
					size: collections[EntityType.Session].size,
					color: collections[EntityType.Session].color,
					type: 'rect',
					collection: EntityType.Session,
					g6Type: collections[EntityType.Session].g6Type,
					g6Style: {
						...collections[EntityType.Session].g6Style,
						badge: { text: toStatusBadge(session.status) ?? 'LIVE' },
						lineDash: statusLineDash(session.status),
						opacity: statusOpacity(session.status),
					},
					disabled: session.status === 'Finalized',
					details: {
						status: session.status,
						actions: session.actions.join(', '),
						simulations: session.simulationCount ?? 0,
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					if (session.execution?.chainId) {
						const networkId = `network:${session.execution.chainId}`
						if (g.hasNode(networkId)) {
							addRelationEdge('session', networkId, sessionId)
						}
					}
				}
			})
		}

		// Add transaction session simulation nodes
		if (visibleCollections.has(EntityType.SessionSimulation)) {
			const simulations = rowsForType(
				EntityType.SessionSimulation,
				sessionSimulationsQuery.data,
			)
			simulations.forEach(({ row: simulation }, i) => {
				if (skipEntity(EntityType.SessionSimulation, undefined)) return
				const simulationId = `simulation:${simulation.id}`
				if (g.hasNode(simulationId)) return
				const pos = positionInRing(
					collections[EntityType.SessionSimulation].ring,
					i,
					simulations.length,
				)
				addNode({
					id: simulationId,
					label: `Sim ${simulation.id.slice(0, 6)}`,
					...pos,
					size: collections[EntityType.SessionSimulation].size,
					color: collections[EntityType.SessionSimulation].color,
					type: 'rect',
					collection: EntityType.SessionSimulation,
					g6Type: collections[EntityType.SessionSimulation].g6Type,
					g6Style: {
						...collections[EntityType.SessionSimulation].g6Style,
						badge: { text: toStatusBadge(simulation.status) ?? 'SIM' },
						lineDash: statusLineDash(simulation.status),
						opacity: statusOpacity(simulation.status),
					},
					disabled: simulation.status === 'failed',
					details: {
						status: simulation.status,
						sessionId: simulation.sessionId,
					},
				})
				const sessionId = `session:${simulation.sessionId}`
				if (g.hasNode(sessionId)) {
					addRelationEdge('simulation', sessionId, simulationId, {
						size: 1,
						disabled: simulation.status === 'failed',
					})
				}
			})
		}

		// Add transfer graph nodes
		if (visibleCollections.has(EntityType.TransferGraph)) {
			const graphs = rowsForType(
				EntityType.TransferGraph,
				transferGraphsQuery.data,
			)
			graphs.forEach(({ row: graph }, i) => {
				if (skipEntity(EntityType.TransferGraph, graph.$source)) return
				const graphId = `transfer-graph:${graph.$id.symbol}:${graph.$id.period}`
				if (g.hasNode(graphId)) return
				const pos = positionInRing(
					collections[EntityType.TransferGraph].ring,
					i,
					graphs.length,
				)
				addNode({
					id: graphId,
					label: `${graph.$id.symbol} ${graph.period}`,
					...pos,
					size: collections[EntityType.TransferGraph].size,
					color: collections[EntityType.TransferGraph].color,
					type: 'rect',
					collection: EntityType.TransferGraph,
					g6Type: collections[EntityType.TransferGraph].g6Type,
					g6Style: collections[EntityType.TransferGraph].g6Style,
					disabled: graph.isLoading || graph.error !== null,
					details: {
						nodes: graph.graph.nodes.length,
						edges: graph.graph.edges.length,
						error: graph.error,
					},
				})
			})
		}

		// Add room nodes
		if (visibleCollections.has(EntityType.Room)) {
			const rooms = rowsForType(EntityType.Room, roomsQuery.data)
			rooms.forEach(({ row: room }, i) => {
				if (skipEntity(EntityType.Room, room.$source)) return
				const roomId = `room:${room.$id.id}`
				if (g.hasNode(roomId)) return
				const pos = positionInRing(
					collections[EntityType.Room].ring,
					i,
					rooms.length,
				)
				addNode({
					id: roomId,
					label: room.name ?? room.$id.id,
					...pos,
					size: collections[EntityType.Room].size,
					color: collections[EntityType.Room].color,
					type: 'rect',
					collection: EntityType.Room,
					g6Type: collections[EntityType.Room].g6Type,
					g6Style: collections[EntityType.Room].g6Style,
					details: {
						createdBy: room.createdBy,
						createdAt: room.createdAt,
					},
				})
			})
		}

		// Add room peer nodes
		if (visibleCollections.has(EntityType.RoomPeer)) {
			const peers = rowsForType(
				EntityType.RoomPeer,
				roomPeersQuery.data,
			)
			peers.forEach(({ row: peer }, i) => {
				if (skipEntity(EntityType.RoomPeer, peer.$source)) return
				const peerId = `peer:${peer.id}`
				if (g.hasNode(peerId)) return
				const pos = positionInRing(
					collections[EntityType.RoomPeer].ring,
					i,
					peers.length,
				)
				addNode({
					id: peerId,
					label: peer.displayName ?? peer.peerId,
					...pos,
					size: collections[EntityType.RoomPeer].size,
					color: collections[EntityType.RoomPeer].color,
					type: 'circle',
					collection: EntityType.RoomPeer,
					g6Type: collections[EntityType.RoomPeer].g6Type,
					g6Style: {
						...collections[EntityType.RoomPeer].g6Style,
						badge: { text: peer.isConnected ? 'ON' : 'OFF' },
						lineDash: peer.isConnected ? undefined : [4, 4],
						opacity: peer.isConnected ? 1 : 0.6,
					},
					disabled: !peer.isConnected,
					intent: toIntentPayload(EntityType.RoomPeer, {
						roomId: peer.roomId,
						peerId: peer.peerId,
					}),
					details: {
						roomId: peer.roomId,
						peerId: peer.peerId,
						connected: peer.isConnected,
					},
				})
				const roomId = `room:${peer.roomId}`
				if (g.hasNode(roomId)) {
					addRelationEdge('peer', roomId, peerId, {
						size: 1,
						disabled: !peer.isConnected,
					})
				}
			})
		}

		// Add shared address nodes
		if (visibleCollections.has(EntityType.SharedAddress)) {
			const shared = rowsForType(
				EntityType.SharedAddress,
				sharedAddressesQuery.data,
			)
			shared.forEach(({ row: sharedAddr }, i) => {
				if (
					sharedAddr.$source != null &&
					!isEntitySourceVisible(EntityType.SharedAddress, sharedAddr.$source)
				)
					return
				const sharedId = `shared:${sharedAddr.id}`
				if (g.hasNode(sharedId)) return
				const pos = positionInRing(
					collections[EntityType.SharedAddress].ring,
					i,
					shared.length,
				)
				addNode({
					id: sharedId,
					label: sharedAddr.address.slice(0, 10) + '…',
					...pos,
					size: collections[EntityType.SharedAddress].size,
					color: collections[EntityType.SharedAddress].color,
					type: 'circle',
					collection: EntityType.SharedAddress,
					g6Type: collections[EntityType.SharedAddress].g6Type,
					g6Style: {
						...collections[EntityType.SharedAddress].g6Style,
						badge: { text: '' },
					},
					details: {
						roomId: sharedAddr.roomId,
						peerId: sharedAddr.peerId,
					},
				})
				const roomId = `room:${sharedAddr.roomId}`
				if (g.hasNode(roomId)) {
					addRelationEdge('shared', roomId, sharedId, {
						size: 1,
						type: 'line',
					})
				}
			})
		}

		// Add SIWE challenge nodes
		if (visibleCollections.has(EntityType.SiweChallenge)) {
			const challenges = rowsForType(
				EntityType.SiweChallenge,
				siweChallengesQuery.data,
			)
			challenges.forEach(({ row: challenge }, i) => {
				if (skipEntity(EntityType.SiweChallenge, challenge.$source)) return
				const challengeId = `siwe:${challenge.id}`
				if (g.hasNode(challengeId)) return
				const pos = positionInRing(
					collections[EntityType.SiweChallenge].ring,
					i,
					challenges.length,
				)
				addNode({
					id: challengeId,
					label: `SIWE ${challenge.address.slice(0, 6)}…`,
					...pos,
					size: collections[EntityType.SiweChallenge].size,
					color: collections[EntityType.SiweChallenge].color,
					type: 'rect',
					collection: EntityType.SiweChallenge,
					g6Type: collections[EntityType.SiweChallenge].g6Type,
					g6Style: {
						...collections[EntityType.SiweChallenge].g6Style,
						badge: { text: challenge.verified ? 'VER' : 'PEND' },
						lineDash: challenge.verified ? undefined : [4, 2],
						opacity: challenge.verified ? 1 : 0.8,
					},
					disabled: !challenge.verified,
					details: {
						roomId: challenge.roomId,
						address: challenge.address,
						verified: challenge.verified,
					},
				})
				const roomId = `room:${challenge.roomId}`
				if (g.hasNode(roomId)) {
					addRelationEdge('siwe', roomId, challengeId, {
						size: 1,
						disabled: !challenge.verified,
					})
				}
			})
		}

		// Add transfer request nodes
		if (visibleCollections.has(EntityType.TransferRequest)) {
			const requests = rowsForType(
				EntityType.TransferRequest,
				transferRequestsQuery.data,
			)
			requests.forEach(({ row: request }, i) => {
				if (skipEntity(EntityType.TransferRequest, request.$source)) return
				const requestId = `transfer-request:${request.id}`
				if (g.hasNode(requestId)) return
				const pos = positionInRing(
					collections[EntityType.TransferRequest].ring,
					i,
					requests.length,
				)
				const disabled = request.status === 'rejected' || request.status === 'expired'
				addNode({
					id: requestId,
					label: `Request ${request.status}`,
					...pos,
					size: collections[EntityType.TransferRequest].size,
					color: collections[EntityType.TransferRequest].color,
					type: 'rect',
					collection: EntityType.TransferRequest,
					g6Type: collections[EntityType.TransferRequest].g6Type,
					g6Style: {
						...collections[EntityType.TransferRequest].g6Style,
						badge: { text: toStatusBadge(request.status) ?? 'REQ' },
						lineDash: statusLineDash(request.status),
						opacity: statusOpacity(request.status),
					},
					disabled,
					details: {
						from: request.from,
						to: request.to,
						allocations: request.allocations.length,
					},
				})
				const roomId = `room:${request.roomId}`
				if (g.hasNode(roomId)) {
					addEdge({
						id: `edge:${edgeIndex++}`,
						source: roomId,
						target: requestId,
						size: 1.2,
						color: edgeColors.transferRequest,
						type: 'curvedArrow',
						relation: 'transferRequest',
						g6Style: edgeStyles.transferRequest,
						disabled,
					})
				}
			})
		}

		// Add yellow channel nodes
		if (visibleCollections.has(EntityType.StateChannel)) {
			const channels = rowsForType(
				EntityType.StateChannel,
				yellowChannelsQuery.data,
			)
			channels.forEach(({ row: channel }, i) => {
				if (skipEntity(EntityType.StateChannel, channel.$source)) return
				const channelId = `yellow:${channel.id}`
				if (g.hasNode(channelId)) return
				const pos = positionInRing(
					collections[EntityType.StateChannel].ring,
					i,
					channels.length,
				)
				addNode({
					id: channelId,
					label: `Channel ${channel.id.slice(0, 6)}`,
					...pos,
					size: collections[EntityType.StateChannel].size,
					color: collections[EntityType.StateChannel].color,
					type: 'rect',
					collection: EntityType.StateChannel,
					g6Type: collections[EntityType.StateChannel].g6Type,
					g6Style: {
						...collections[EntityType.StateChannel].g6Style,
						badge: { text: toStatusBadge(channel.status) ?? 'LIVE' },
						lineDash: statusLineDash(channel.status),
						opacity: statusOpacity(channel.status),
					},
					disabled: channel.status === 'closed',
					details: {
						status: channel.status,
						chainId: channel.chainId,
						asset: channel.asset,
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					const networkId = `network:${channel.chainId}`
					if (g.hasNode(networkId)) {
						addRelationEdge('yellow', networkId, channelId, {
							size: 1.5,
							disabled: channel.status === 'closed',
						})
					}
				}
			})
		}

		// Add yellow channel state nodes
		if (visibleCollections.has(EntityType.StateChannelState)) {
			const states = rowsForType(
				EntityType.StateChannelState,
				stateChannelStatesQuery.data,
			)
			states.forEach(({ row: state }, i) => {
				if (skipEntity(EntityType.StateChannelState, state.$source)) return
				const stateId = `yellow-state:${state.id}`
				if (g.hasNode(stateId)) return
				const pos = positionInRing(
					collections[EntityType.StateChannelState].ring,
					i,
					states.length,
				)
				addNode({
					id: stateId,
					label: `State v${state.version}`,
					...pos,
					size: collections[EntityType.StateChannelState].size,
					color: collections[EntityType.StateChannelState].color,
					type: 'rect',
					collection: EntityType.StateChannelState,
					g6Type: collections[EntityType.StateChannelState].g6Type,
					g6Style: {
						...collections[EntityType.StateChannelState].g6Style,
						badge: { text: state.isFinal ? 'FINAL' : 'LIVE' },
						lineDash: state.isFinal ? [6, 3] : undefined,
						opacity: state.isFinal ? 0.75 : 1,
					},
					disabled: state.isFinal,
					details: {
						channelId: state.channelId,
						intent: state.intent,
						isFinal: state.isFinal,
					},
				})
				const channelId = `yellow:${state.channelId}`
				if (g.hasNode(channelId)) {
					addRelationEdge('yellow', channelId, stateId, {
						size: 1,
						disabled: state.isFinal,
					})
				}
			})
		}

		// Add yellow deposit nodes
		if (visibleCollections.has(EntityType.StateChannelDeposit)) {
			const deposits = rowsForType(
				EntityType.StateChannelDeposit,
				stateChannelDepositsQuery.data,
			)
			deposits.forEach(({ row: deposit }, i) => {
				if (skipEntity(EntityType.StateChannelDeposit, deposit.$source)) return
				const depositId = `yellow-deposit:${deposit.id}`
				if (g.hasNode(depositId)) return
				const pos = positionInRing(
					collections[EntityType.StateChannelDeposit].ring,
					i,
					deposits.length,
				)
				addNode({
					id: depositId,
					label: `Deposit ${deposit.address.slice(0, 6)}…`,
					...pos,
					size: collections[EntityType.StateChannelDeposit].size,
					color: collections[EntityType.StateChannelDeposit].color,
					type: 'circle',
					collection: EntityType.StateChannelDeposit,
					g6Type: collections[EntityType.StateChannelDeposit].g6Type,
					g6Style: {
						...collections[EntityType.StateChannelDeposit].g6Style,
						badge: deposit.lockedBalance > 0n ? { text: 'LOCK' } : { text: 'FREE' },
					},
					details: {
						chainId: deposit.chainId,
						available: deposit.availableBalance.toString(),
						locked: deposit.lockedBalance.toString(),
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					const networkId = `network:${deposit.chainId}`
					if (g.hasNode(networkId)) {
						addRelationEdge('yellow', networkId, depositId, {
							size: 1,
							type: 'line',
						})
					}
				}
			})
		}

		// Add yellow transfer nodes
		if (visibleCollections.has(EntityType.StateChannelTransfer)) {
			const transfers = rowsForType(
				EntityType.StateChannelTransfer,
				stateChannelTransfersQuery.data,
			)
			transfers.forEach(({ row: transfer }, i) => {
				if (skipEntity(EntityType.StateChannelTransfer, transfer.$source)) return
				const transferId = `yellow-transfer:${transfer.id}`
				if (g.hasNode(transferId)) return
				const pos = positionInRing(
					collections[EntityType.StateChannelTransfer].ring,
					i,
					transfers.length,
				)
				addNode({
					id: transferId,
					label: `${transfer.status} transfer`,
					...pos,
					size: collections[EntityType.StateChannelTransfer].size,
					color: collections[EntityType.StateChannelTransfer].color,
					type: 'circle',
					collection: EntityType.StateChannelTransfer,
					g6Type: collections[EntityType.StateChannelTransfer].g6Type,
					g6Style: {
						...collections[EntityType.StateChannelTransfer].g6Style,
						badge: { text: toStatusBadge(transfer.status) ?? 'XFER' },
						lineDash: statusLineDash(transfer.status),
						opacity: statusOpacity(transfer.status),
					},
					disabled: transfer.status === 'failed',
					details: {
						channelId: transfer.channelId,
						amount: transfer.amount.toString(),
						status: transfer.status,
					},
				})
				const channelId = `yellow:${transfer.channelId}`
				if (g.hasNode(channelId)) {
					addRelationEdge('yellow', channelId, transferId, {
						size: 1,
						disabled: transfer.status === 'failed',
					})
				}
			})
		}

		// Add dashboard panel nodes
		if (visibleCollections.has(EntityType.Dashboard)) {
			const panels = rowsForType(
				EntityType.Dashboard,
				dashboardsQuery.data,
			)
			panels.forEach(({ row: panel }, i) => {
				if (skipEntity(EntityType.Dashboard, undefined)) return
				const panelId = toNodeId('dashboard', panel.$id)
				if (g.hasNode(panelId)) return
				const pos = positionInRing(
					collections[EntityType.Dashboard].ring,
					i,
					panels.length,
				)
				addNode({
					id: panelId,
					label: `Dashboard ${panel.$id.id}`,
					...pos,
					size: collections[EntityType.Dashboard].size,
					color: collections[EntityType.Dashboard].color,
					type: 'rect',
					collection: EntityType.Dashboard,
					g6Type: collections[EntityType.Dashboard].g6Type,
					g6Style: collections[EntityType.Dashboard].g6Style,
					details:
						'focusedPanelId' in panel ?
							{ focusedPanelId: panel.focusedPanelId }
							: {},
				})
			})
		}

		return { graph: g, nodes, edges }
	})

	// (Derived)
	const buildHighlightedNodes = (stack: LiveQueryEntry[] | undefined) => {
		const nodes: string[] = []
		for (const entry of stack ?? []) {
			for (const item of entry.query.data ?? []) {
				const entity = (
					isRecord(item) && 'row' in item
						? item.row
						: isRecord(item) && Object.keys(item).length === 1
							? Object.values(item)[0]
							: null
				)
				if (!isRecord(entity)) continue
				const rowId = '$id' in entity ? entity.$id : undefined
				const rowIdRecord = isRecord(rowId) ? rowId : null

				if (rowIdRecord) {
					if ('rdns' in rowIdRecord && !('wallet$id' in rowIdRecord)) {
						const rdns = rowIdRecord.rdns
						if (typeof rdns === 'string' && rdns) nodes.push(`wallet:${rdns}`)
					} else if ('wallet$id' in rowIdRecord) {
						const walletId = rowIdRecord.wallet$id
						const rdns = (
							isRecord(walletId) && typeof walletId.rdns === 'string'
								? walletId.rdns
								: ''
						)
						if (rdns) nodes.push(`connection:${rdns}`)
					} else if ('network' in rowIdRecord && 'address' in rowIdRecord) {
						const network = rowIdRecord.network
						const address = rowIdRecord.address
						if (typeof network === 'number' && typeof address === 'string') {
							nodes.push(
								'symbol' in entity && typeof entity.symbol === 'string' ?
									`erc20:${network}:${address}`
									: `actor:${network}:${address}`,
							)
						}
					} else if (
						'chainId' in rowIdRecord &&
						'tokenAddress' in rowIdRecord
					) {
						const chainId = rowIdRecord.chainId
						const address = rowIdRecord.address
						const tokenAddress = rowIdRecord.tokenAddress
						if (
							typeof chainId === 'number' &&
							typeof address === 'string' &&
							typeof tokenAddress === 'string'
						) {
							if (
								'spenderAddress' in rowIdRecord &&
								typeof rowIdRecord.spenderAddress === 'string'
							) {
								nodes.push(
									`allowance:${chainId}:${address}:${tokenAddress}:${rowIdRecord.spenderAddress}`,
								)
							} else {
								nodes.push(`coin:${chainId}:${address}:${tokenAddress}`)
							}
						}
					} else if ('chainId' in rowIdRecord && 'address' in rowIdRecord) {
						const chainId = rowIdRecord.chainId
						const address = rowIdRecord.address
						if (typeof chainId === 'number' && typeof address === 'string') {
							nodes.push(`token:${chainId}:${address}`)
						}
					} else if ('routeId' in rowIdRecord && 'quote' in rowIdRecord) {
						const routeId = rowIdRecord.routeId
						if (typeof routeId === 'string' && routeId) {
							nodes.push(`route:${routeId}`)
						}
					} else if ('sourceTxHash' in rowIdRecord) {
						const sourceTxHash = rowIdRecord.sourceTxHash
						if (typeof sourceTxHash === 'string') {
							nodes.push(`tx:${sourceTxHash}`)
						}
					} else if ('assetId' in rowIdRecord && 'transport' in rowIdRecord) {
						nodes.push(toNodeId('stork', rowIdRecord))
					} else if ('apiHost' in rowIdRecord) {
						nodes.push(
							'fromDomain' in rowIdRecord && 'toDomain' in rowIdRecord
								? toNodeId('cctp-fee', rowIdRecord)
								: toNodeId('cctp-allowance', rowIdRecord),
						)
					} else if (
						'period' in rowIdRecord &&
						'symbol' in rowIdRecord &&
						typeof rowIdRecord.period === 'string' &&
						typeof rowIdRecord.symbol === 'string'
					) {
						nodes.push(
							`transfer-graph:${rowIdRecord.symbol}:${rowIdRecord.period}`,
						)
					} else if ('id' in rowIdRecord) {
						nodes.push(toNodeId('dashboard', rowIdRecord))
					}
				} else if (typeof rowId === 'number') {
					nodes.push(`network:${rowId}`)
				}

				const rowIdString = (
					typeof rowId === 'string'
						? rowId
						: 'id' in entity && typeof entity.id === 'string'
							? entity.id
							: null
				)

				if (!rowIdString) continue

				if ('tokenIn' in entity && 'tokenOut' in entity) {
					nodes.push(`swap:${rowIdString}`)
				} else if ('token0' in entity && 'token1' in entity) {
					nodes.push(`pool:${rowIdString}`)
				} else if ('poolId' in entity && 'owner' in entity) {
					nodes.push(`position:${rowIdString}`)
				} else if ('actions' in entity && Array.isArray(entity.actions)) {
					nodes.push(`session:${rowIdString}`)
				} else if ('sessionId' in entity && 'status' in entity) {
					nodes.push(`simulation:${rowIdString}`)
				} else if ('createdBy' in entity && 'createdAt' in entity) {
					nodes.push(`room:${rowIdString}`)
				} else if ('peerId' in entity && 'roomId' in entity && 'isConnected' in entity) {
					nodes.push(`peer:${rowIdString}`)
				} else if ('peerId' in entity && 'address' in entity && 'sharedAt' in entity) {
					nodes.push(`shared:${rowIdString}`)
				} else if ('nonce' in entity && 'message' in entity) {
					nodes.push(`siwe:${rowIdString}`)
				} else if ('allocations' in entity && Array.isArray(entity.allocations)) {
					nodes.push(`transfer-request:${rowIdString}`)
				} else if ('participant0' in entity && 'participant1' in entity) {
					nodes.push(`yellow:${rowIdString}`)
				} else if ('channelId' in entity && 'stateData' in entity) {
					nodes.push(`yellow-state:${rowIdString}`)
				} else if ('availableBalance' in entity && 'lockedBalance' in entity) {
					nodes.push(`yellow-deposit:${rowIdString}`)
				} else if ('channelId' in entity && 'amount' in entity && 'turnNum' in entity) {
					nodes.push(`yellow-transfer:${rowIdString}`)
				}
			}
		}
		return nodes
	}

	const highlightedNodes = $derived.by(() =>
		buildHighlightedNodes(queryStack ?? localLiveQueryCtx.stack),
	)

	const globalHighlightedNodes = $derived.by(() =>
		buildHighlightedNodes(globalQueryStack ?? globalLiveQueryCtx.stack),
	)

	const highlightedSet = $derived(
		new Set(highlightedNodes)
	)
	const globalHighlightedSet = $derived(
		new Set(globalHighlightedNodes)
	)
	const showGlobalHighlights = $derived(
		globalQueryStack !== undefined || globalLiveQueryCtx.stack.length > 0
	)

	// (Derived)
	const selectedNodeSet = $derived(
		new Set(selectedNodes)
	)
	const selectedEdgeSet = $derived(
		new Set(selectedEdges)
	)

	const hexToRgb = (hex: string) => {
		const normalized = hex.replace('#', '')
		const full = (
			normalized.length === 3
				? normalized
						.split('')
						.map((c) => `${c}${c}`)
						.join('')
				: normalized
		)
		if (full.length !== 6) return null
		const r = Number.parseInt(full.slice(0, 2), 16)
		const g = Number.parseInt(full.slice(2, 4), 16)
		const b = Number.parseInt(full.slice(4, 6), 16)
		return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)
			? null
			: { r, g, b }
	}

	const colorWithAlpha = (color: string, alpha: number) => {
		const rgb = color.startsWith('#') ? hexToRgb(color) : null
		return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : color
	}

	const nodeReducer = (
		node: string,
		data: Attributes,
	): Partial<DisplayData> => {
		const isLocalHighlighted = highlightedSet.has(node)
		const isGlobalHighlighted = globalHighlightedSet.has(node)
		const isSelected = selectedNodeSet.has(node)
		const isHovered = hoveredNode === node
		const color = typeof data.color === 'string' ? data.color : '#888888'
		const size = typeof data.size === 'number' ? data.size : 5
		return {
			...data,
			color:
				isHovered || isSelected || isLocalHighlighted
					? color
					: isGlobalHighlighted
						? colorWithAlpha(color, 0.5)
						: colorWithAlpha(color, 0.18),
			size: isHovered
				? size * 1.8
				: isSelected
					? size * 1.4
					: isLocalHighlighted
						? size * 1.2
						: isGlobalHighlighted
							? size * 0.9
							: size * 0.7,
			zIndex: isHovered
				? 2
				: isSelected
					? 1.5
					: isLocalHighlighted
						? 1
						: isGlobalHighlighted
							? 0.6
							: 0,
		}
	}

	const edgeReducer = (
		edge: string,
		data: Attributes,
	): Partial<DisplayData> => {
		const source = graphModel?.graph.source(edge)
		const target = graphModel?.graph.target(edge)
		const isLocalHighlighted = (
			(source && highlightedSet.has(source)) ||
			(target && highlightedSet.has(target))
		)
		const isGlobalHighlighted = (
			(source && globalHighlightedSet.has(source)) ||
			(target && globalHighlightedSet.has(target))
		)
		const isSelected = selectedEdgeSet.has(edge)
		const isHovered = (
			(source && hoveredNode === source) || (target && hoveredNode === target)
		)
		const color = typeof data.color === 'string' ? data.color : '#888888'
		const size = typeof data.size === 'number' ? data.size : 1
		return {
			...data,
			color:
				isHovered || isSelected || isLocalHighlighted
					? color
					: isGlobalHighlighted
						? colorWithAlpha(color, 0.4)
						: colorWithAlpha(color, 0.12),
			size: isHovered
				? size * 2
				: isSelected
					? size * 1.7
					: isLocalHighlighted
						? size * 1.5
						: isGlobalHighlighted
							? size * 0.9
							: size * 0.4,
		}
	}

	// (Derived)
	const hoveredNodeData = $derived(
		hoveredNode && graphModel
			? graphModel.graph.getNodeAttributes(hoveredNode)
			: null
	)
	const hoveredNodeEntries = $derived.by(() => {
		const details = hoveredNodeData?.details
		return isRecord(details) ? Object.entries(details) : []
	})
	const selectionCount = $derived(
		selectedNodes.length + selectedEdges.length
	)
	const selectionAnnouncement = $derived.by(() => {
		const count = selectionCount
		if (count === 0) return 'Selection cleared'
		const nodeCount = selectedNodes.length
		const edgeCount = selectedEdges.length
		const nodeLabel = (
			nodeCount > 0 ? `${nodeCount} node${nodeCount === 1 ? '' : 's'}` : ''
		)
		const edgeLabel = (
			edgeCount > 0 ? `${edgeCount} edge${edgeCount === 1 ? '' : 's'}` : ''
		)
		return `Selected ${nodeLabel}${nodeLabel && edgeLabel ? ' and ' : ''}${edgeLabel}`
	})
	type SelectionNodeItem = {
		id: string
		kind: 'node'
		label: string
		collection: string
		href?: string
	}
	type SelectionEdgeItem = {
		id: string
		kind: 'edge'
		label: string
		collection: string
	}
	const selectionItems = $derived.by(
		(): (SelectionNodeItem | SelectionEdgeItem)[] => {
			if (!graphModel) return []
			const items: (SelectionNodeItem | SelectionEdgeItem)[] = (
				selectedNodes.map((nodeId): SelectionNodeItem => {
					const attrs = graphModel.graph.getNodeAttributes(nodeId)
					const label = typeof attrs.label === 'string' ? attrs.label : nodeId
					const collection = (
						typeof attrs.collection === 'string' ? attrs.collection : 'node'
					)
					const details = isRecord(attrs.details) ? attrs.details : null
					let href: string | undefined
					if (collection === EntityType.Network && details?.slug) {
						href = `/network/${details.slug}`
					} else if (
						collection === EntityType.Block &&
						details?.networkSlug != null &&
						details?.blockNumber != null
					) {
						href = `/network/${details.networkSlug}/block/${details.blockNumber}`
					}
					return { id: nodeId, kind: 'node', label, collection, href }
				})
			)
			for (const edgeId of selectedEdges) {
				const edge = graphModel.edges.find((entry) => entry.id === edgeId)
				items.push({
					id: edgeId,
					kind: 'edge',
					label: edge?.relation ?? 'edge',
					collection: edge?.relation ?? 'edge',
				})
			}
			return items
		},
	)

	// (Derived)
	const refreshKey = $derived(
		[
			...graphQueries.map((q) => q.data?.length),
			[...visibleCollections].join(','),
			[...hiddenEntitySources].sort().join(','),
		].join(':')
	)
</script>


<details
	class="graph-scene"
	data-card="padding-0 radius-6"
	bind:open={graphSceneState.current.isVisible}
>
	<summary
		class="graph-scene-header"
		data-row="align-center"
	>
		<h4 data-row-item="flexible">Data Graph</h4>

		<Select
			class="graph-scene-framework"
			items={graphFrameworkItems}
			bind:value={frameworkSelection}
			getItemId={(x) => x}
			getItemLabel={(x) => (x === GraphFramework.Sigma ? 'Sigma' : 'G6')}
			ariaLabel="Graph framework"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		/>
		{#if graphModel}
			<div
				class="graph-scene-stats"
				data-row="gap-1"
			>
				{graphModel.graph.order} nodes · {graphModel.graph.size} edges
				{#if highlightedSet.size > 0}
					<span
						class="graph-scene-highlight"
						data-scope="local"
					>
						· {highlightedNodes.length} local
					</span>
				{/if}

				{#if showGlobalHighlights && globalHighlightedSet.size > 0}
					<span
						class="graph-scene-highlight"
						data-scope="global"
					>
						· {globalHighlightedNodes.length} global
					</span>
				{/if}
			</div>
		{/if}
	</summary>

	{#if graphModel}
		<div class="graph-scene-body" data-row="gap-0 align-stretch">
			<div class="graph-scene-container">
				{#if graphFramework === GraphFramework.G6}
				<G6Graph
					model={graphModel}
					{highlightedNodes}
					{globalHighlightedNodes}
						bind:selection
						onNodeEnter={(node) => {
							hoveredNode = node
						}}
						onNodeLeave={() => {
							hoveredNode = undefined
						}}
					/>
				{:else}
					<SigmaGraphView
						model={graphModel}
						{refreshKey}
						{highlightedNodes}
						{nodeReducer}
						{edgeReducer}
						onNodeEnter={(node) => {
							hoveredNode = node
						}}
						onNodeLeave={() => {
							hoveredNode = undefined
						}}
						onNodeClick={(node) => {
							selection = { nodes: [node], edges: [] }
						}}
						onEdgeClick={(edge) => {
							selection = { nodes: [], edges: [edge] }
						}}
					/>
				{/if}

				{#if hoveredNodeData}
					<div class="graph-scene-hover">
						<div class="graph-scene-hover-header">
							<span
								class="graph-scene-dot"
								style="background: {hoveredNodeData.color}"
							></span>
							<strong>{hoveredNodeData.label}</strong>
						</div>

						<small class="graph-scene-collection">
							{hoveredNodeData.collection}
						</small>

						{#if hoveredNodeEntries.length > 0}
							<dl class="graph-scene-details">
								{#each hoveredNodeEntries as [key, value] (key)}
									{#if value !== undefined && value !== null && value !== ''}
										<dt>{key}</dt>
										<dd>{value}</dd>
									{/if}
								{/each}
							</dl>
						{/if}
					</div>
				{/if}

				<div
					class="sr-only"
					aria-live="polite"
				>
					{selectionAnnouncement}
				</div>
			</div>

			<aside class="graph-scene-sidebar" data-column>
				<div data-column>
					<label for="graph-scene-entity-types">Entity types</label>

					{#if true}
						<Combobox
							id="graph-scene-entity-types"
							type="multiple"
							items={legendEntityTypeItems}
							bind:value={visibleEntitiesSelection}
							getItemId={(x) => x.id}
							getItemLabel={(x) => x.label}
							placeholder="Filter by type…"
							aria-label="Visible entity types"
						>
							{#snippet Item(item, selected)}
								<span
									data-row="align-center"
									style="--color: {item.color}"
								>
									<span
										class="graph-scene-dot"
										style="background: {item.color}"
									></span>
									{item.label}
									{#if counts[item.id] > 0}
										<span data-tag="count">{counts[item.id]}</span>
									{/if}
								</span>
							{/snippet}
						</Combobox>
					{/if}
				</div>

				<div data-column>
					<label for="graph-scene-expanded">Expand scope (full collection)</label>

					<Combobox
						id="graph-scene-expanded"
						type="multiple"
						items={expandableEntityTypeItems}
						bind:value={expandedEntitiesSelection}
						getItemId={(x) => x.id}
						getItemLabel={(x) => x.label}
						placeholder="Watched only by default…"
						aria-label="Entity types to load full collection"
					>
						{#snippet Item(item, selected)}
							<span
								data-row="align-center"
								style="--color: {item.color}"
							>
								<span
									class="graph-scene-dot"
									style="background: {item.color}"
								></span>
								{item.label}
							</span>
						{/snippet}
					</Combobox>
				</div>

				{#if entitySourceCombos.length > 0}
					<div data-column>
						<label for="graph-scene-sources">By source</label>

						<Combobox
							id="graph-scene-sources"
							type="multiple"
							items={entitySourceCombos}
							bind:value={visibleSourceKeysSelection}
							getItemId={(c) => comboKey(c.entityType, c.source)}
							getItemLabel={(c) =>
								`${collections[c.entityType]?.label ?? c.entityType}: ${c.source}`}
							placeholder="Filter by source…"
							aria-label="Visible entity sources"
						/>
					</div>
				{/if}

				{#if selectionItems.length > 0}
					<div class="graph-scene-selection" data-column>
						<h5>Selection</h5>
						<ul data-column>
							{#each selectionItems as item (item.id)}
								<li>
									{#if item.kind === 'node' && 'href' in item && item.href}
										<a
											href={item.href}
											data-kind={item.kind}
											data-row="align-center"
											class="graph-scene-selection-link"
										>
											<strong data-row-item="flexible">{item.label}</strong>
											<span>{item.collection}</span>
										</a>
									{:else}
										<button
											type="button"
											data-kind={item.kind}
											data-row="align-center"
											onclick={() => {
												if (item.kind === 'node') {
													selection = {
														nodes: [item.id],
														edges: [],
													}
													hoveredNode = item.id
												} else {
													selection = {
														nodes: [],
														edges: [item.id],
													}
												}
											}}
										>
											<strong data-row-item="flexible">{item.label}</strong>
											<span>{item.collection}</span>
										</button>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</aside>
		</div>
	{/if}
</details>


<style>
	details.graph-scene {
		--graph-scene-canvas-bg: light-dark(
			linear-gradient(145deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%),
			linear-gradient(145deg, #1f2937 0%, #111827 50%, #0f172a 100%)
		);
		--graph-scene-hover-bg: light-dark(rgba(255, 255, 255, 0.97), rgba(31, 41, 55, 0.97));
		--graph-scene-hover-border: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.06));
		--graph-scene-details-border: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.06));
		--graph-scene-legend-active-bg: color-mix(in srgb, var(--color) 8%, white);
		--graph-scene-legend-count-bg: color-mix(in srgb, var(--color) 15%, white);
		--graph-scene-framework-active-bg: var(--color-text);
		--graph-scene-framework-active-border: var(--color-text);
		--graph-scene-framework-active-fg: var(--color-text-inverted);

		&:open .graph-scene-body {
			min-height: 380px;
			display: flex;
			flex-direction: row;
			min-width: 0;
		}

		> summary {
			padding: 0.5rem 0.75rem;
			border-bottom: 1px solid var(--color-border);
			background: var(--color-bg-subtle);
			border-radius: 0.75rem 0.75rem 0 0;
			list-style: none;
			cursor: pointer;

			&::-webkit-details-marker {
				display: none;
			}

			&::marker {
				display: none;
			}

			&::before {
				content: '▼';
				font-size: 0.625rem;
				opacity: 0.6;
			}

			> h4 {
				margin: 0;
				font-size: 0.8125rem;
				font-weight: 600;
			}

			> .graph-scene-framework > button[data-active='true'] {
				background: var(--graph-scene-framework-active-bg);
				border-color: var(--graph-scene-framework-active-border);
				color: var(--graph-scene-framework-active-fg);
			}

			> .graph-scene-stats {
				font-size: 0.6875rem;
				opacity: 0.6;

				.graph-scene-highlight {
					color: var(--color-primary);
					font-weight: 500;
				}

				.graph-scene-highlight[data-scope='global'] {
					color: var(--color-warning);
				}
			}
		}

		&:not([open]) > summary::before {
			content: '▲';
		}

		> .graph-scene-body > .graph-scene-container {
			flex: 1;
			min-width: 0;
			min-height: 0;
			position: relative;
			background: var(--graph-scene-canvas-bg);

			> .graph-scene-hover {
				position: absolute;
				top: 0.5rem;
				left: 0.5rem;
				background: var(--graph-scene-hover-bg);
				backdrop-filter: blur(12px);
				padding: 0.5rem 0.75rem;
				border-radius: 0.5rem;
				box-shadow: 0 4px 12px light-dark(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.35));
				display: flex;
				flex-direction: column;
				gap: 0.25rem;
				max-width: 200px;
				pointer-events: none;
				border: 1px solid var(--graph-scene-hover-border);

				> .graph-scene-hover-header {
					display: flex;
					align-items: center;
					gap: 0.375rem;

					> .graph-scene-dot {
						width: 8px;
						height: 8px;
						border-radius: 50%;
						flex-shrink: 0;
					}
				}

				strong {
					font-size: 0.75rem;
					font-weight: 600;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}

				> .graph-scene-collection {
					font-size: 0.625rem;
					text-transform: uppercase;
					letter-spacing: 0.05em;
					opacity: 0.5;
				}

				> .graph-scene-details {
					display: grid;
					grid-template-columns: auto 1fr;
					gap: 0.125rem 0.5rem;
					font-size: 0.625rem;
					margin: 0.25rem 0 0;
					padding-top: 0.25rem;
					border-top: 1px solid var(--graph-scene-details-border);

					> dt {
						opacity: 0.5;
						text-transform: capitalize;
					}

					> dd {
						margin: 0;
						font-family: ui-monospace, monospace;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
				}
			}
		}

		> .graph-scene-body > .graph-scene-sidebar {
			width: 16rem;
			flex-shrink: 0;
			padding: 0.5rem 0.625rem;
			border-inline-start: 1px solid var(--color-border);
			background: var(--color-bg-subtle);
			overflow-y: auto;

			> [data-column] > label {
				font-size: 0.625rem;
				text-transform: uppercase;
				letter-spacing: 0.04em;
				opacity: 0.6;
			}

			.graph-scene-dot {
				width: 6px;
				height: 6px;
				border-radius: 50%;
				flex-shrink: 0;
			}

			[data-tag~='count'] {
				font-size: 0.5625rem;
				font-weight: 600;
				background: var(--graph-scene-legend-count-bg);
				color: var(--color);
				padding: 0.0625rem 0.25rem;
				border-radius: 0.75rem;
				min-width: 1rem;
				text-align: center;
			}

			> .graph-scene-selection {
				border-top: 1px solid var(--color-border);
				padding-top: 0.5rem;

				> h5 {
					margin: 0;
					font-size: 0.625rem;
					text-transform: uppercase;
					letter-spacing: 0.04em;
					opacity: 0.6;
				}

				button {
					width: 100%;
				}

				.graph-scene-selection-link {
					width: 100%;
					display: block;
					color: inherit;
					text-decoration: none;
				}

				.graph-scene-selection-link:hover {
					text-decoration: underline;
				}

				button strong,
				.graph-scene-selection-link strong {
					font-weight: 600;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}

				button span,
				.graph-scene-selection-link span {
					opacity: 0.5;
					font-size: 0.5625rem;
					text-transform: uppercase;
					letter-spacing: 0.04em;
				}
			}
		}
	}
</style>
