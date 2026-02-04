<script lang="ts">
	// Types/constants
	import type { Attributes } from 'graphology-types'
	import type { DisplayData } from 'sigma/types'
	import type {
		GraphEdge,
		GraphEdgeStyle,
		GraphFramework,
		GraphModel,
		GraphNode,
		GraphNodeStyle,
	} from '$/lib/graph-model'
	import { actorAllowancesCollection } from '$/collections/actor-allowances'
	import { actorCoinsCollection } from '$/collections/actor-coins'
	import { actorsCollection } from '$/collections/actors'
	import { bridgeRouteItemsCollection } from '$/collections/bridge-routes'
	import { cctpAllowanceCollection } from '$/collections/cctp-allowance'
	import { cctpFeesCollection } from '$/collections/cctp-fees'
	import { coinsCollection } from '$/collections/coins'
	import { dashboardPanelsCollection } from '$/collections/dashboard-panels'
	import { networksCollection } from '$/collections/networks'
	import { roomPeersCollection } from '$/collections/room-peers'
	import { roomsCollection } from '$/collections/rooms'
	import { sharedAddressesCollection } from '$/collections/shared-addresses'
	import { siweChallengesCollection } from '$/collections/siwe-challenges'
	import { storkPricesCollection } from '$/collections/stork-prices'
	import { swapQuotesCollection } from '$/collections/swap-quotes'
	import { tokenListCoinsCollection } from '$/collections/token-list-coins'
	import { transactionSessionSimulationsCollection } from '$/collections/transaction-session-simulations'
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'
	import { transactionsCollection } from '$/collections/transactions'
	import { transferGraphsCollection } from '$/collections/transfer-graphs'
	import { transferRequestsCollection } from '$/collections/transfer-requests'
	import { uniswapPoolsCollection } from '$/collections/uniswap-pools'
	import { uniswapPositionsCollection } from '$/collections/uniswap-positions'
	import { walletConnectionsCollection } from '$/collections/wallet-connections'
	import { walletsCollection } from '$/collections/wallets'
	import { yellowChannelStatesCollection } from '$/collections/yellow-channel-states'
	import { yellowChannelsCollection } from '$/collections/yellow-channels'
	import { yellowDepositsCollection } from '$/collections/yellow-deposits'
	import { yellowTransfersCollection } from '$/collections/yellow-transfers'
	import { networksByChainId } from '$/constants/networks'
	import { EntityType } from '$/data/$EntityType'
	import { entityTypes, type GraphSceneEntityType } from '$/constants/entity-types'
	import { GRAPH_SCENE_MAX_PER_COLLECTION } from '$/constants/query-limits'

	// Context
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { useLiveQueryContext } from '$/svelte/live-query-context.svelte'

	// Functions
	import Graph from 'graphology'
	import { formatSmallestToDecimal } from '$/lib/format'
	import { stringify } from '$/lib/stringify'

	// Components
	import G6GraphView from '$/components/G6GraphView.svelte'
	import SigmaGraphView from '$/components/SigmaGraphView.svelte'

	// Context
	const liveQueryCtx = useLiveQueryContext()

	// Props
	let {
		visible = false,
	}: {
		visible?: boolean
	} = $props()

	// State
	let hoveredNode: string | undefined = $state(undefined)
	let expanded = $state(true)
	let visibleCollections: Set<string> = $state(
		new Set(
			entityTypes
				.filter((e): e is typeof e & { inGraph: true } => e.inGraph)
				.map((e) => e.type),
		),
	)
	let graphFramework = $state<GraphFramework>('g6')
	let frameworkReadFromStorage = $state(false)
	let selectedNodes = $state<string[]>([])
	let selectedEdges = $state<string[]>([])

	$effect(() => {
		if (!visible) return
		if (frameworkReadFromStorage) return
		frameworkReadFromStorage = true
		const stored = localStorage.getItem('graph-framework')
		if (stored === 'sigma' || stored === 'g6') {
			graphFramework = stored
		}
	})

	$effect(() => {
		if (!visible) return
		localStorage.setItem('graph-framework', graphFramework)
	})

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
		q.from({ row: transactionsCollection }).select(({ row }) => ({ row })),
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
		q.from({ row: roomsCollection }).select(({ row }) => ({ row })),
	)
	const roomPeersQuery = useLiveQuery((q) =>
		q.from({ row: roomPeersCollection }).select(({ row }) => ({ row })),
	)
	const sharedAddressesQuery = useLiveQuery((q) =>
		q.from({ row: sharedAddressesCollection }).select(({ row }) => ({ row })),
	)
	const siweChallengesQuery = useLiveQuery((q) =>
		q.from({ row: siweChallengesCollection }).select(({ row }) => ({ row })),
	)
	const transactionSessionsQuery = useLiveQuery((q) =>
		q.from({ row: transactionSessionsCollection }).select(({ row }) => ({ row })),
	)
	const transactionSessionSimulationsQuery = useLiveQuery((q) =>
		q
			.from({ row: transactionSessionSimulationsCollection })
			.select(({ row }) => ({ row })),
	)
	const transferGraphsQuery = useLiveQuery((q) =>
		q.from({ row: transferGraphsCollection }).select(({ row }) => ({ row })),
	)
	const transferRequestsQuery = useLiveQuery((q) =>
		q.from({ row: transferRequestsCollection }).select(({ row }) => ({ row })),
	)
	const dashboardPanelsQuery = useLiveQuery((q) =>
		q.from({ row: dashboardPanelsCollection }).select(({ row }) => ({ row })),
	)
	const yellowChannelsQuery = useLiveQuery((q) =>
		q.from({ row: yellowChannelsCollection }).select(({ row }) => ({ row })),
	)
	const yellowChannelStatesQuery = useLiveQuery((q) =>
		q
			.from({ row: yellowChannelStatesCollection })
			.select(({ row }) => ({ row })),
	)
	const yellowDepositsQuery = useLiveQuery((q) =>
		q.from({ row: yellowDepositsCollection }).select(({ row }) => ({ row })),
	)
	const yellowTransfersQuery = useLiveQuery((q) =>
		q.from({ row: yellowTransfersCollection }).select(({ row }) => ({ row })),
	)

	// Types/constants
	type CollectionStyle = {
		color: string
		label: string
		size: number
		ring: number
		g6Type?: string
		g6Style: GraphNodeStyle
	}

	const collections: Record<GraphSceneEntityType, CollectionStyle> = {
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
		[EntityType.DashboardPanel]: {
			color: '#64748b',
			label: 'Panels',
			size: 11,
			ring: 9,
			g6Type: 'rect',
			g6Style: {
				radius: 6,
				labelPlacement: 'top',
				ports: [
					{ placement: 'top' },
					{ placement: 'bottom' },
				],
				opacity: 0.7,
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
		[EntityType.TransactionSession]: {
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
		[EntityType.TransactionSessionSimulation]: {
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
		[EntityType.YellowChannel]: {
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
		[EntityType.YellowChannelState]: {
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
		[EntityType.YellowDeposit]: {
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
		[EntityType.YellowTransfer]: {
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
	}

	const edgeColors = {
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

	// (Derived)
	const counts: Record<GraphSceneEntityType, number> = $derived({
		[EntityType.Wallet]: walletsQuery.data?.length ?? 0,
		[EntityType.WalletConnection]: connectionsQuery.data?.length ?? 0,
		[EntityType.Actor]: actorsQuery.data?.length ?? 0,
		[EntityType.ActorCoin]: actorCoinsQuery.data?.length ?? 0,
		[EntityType.ActorAllowance]: allowancesQuery.data?.length ?? 0,
		[EntityType.BridgeRoute]: routesQuery.data?.length ?? 0,
		[EntityType.Transaction]: txQuery.data?.length ?? 0,
		[EntityType.CctpAllowance]: cctpAllowanceQuery.data?.length ?? 0,
		[EntityType.CctpFee]: cctpFeesQuery.data?.length ?? 0,
		[EntityType.Coin]: coinsQuery.data?.length ?? 0,
		[EntityType.DashboardPanel]: dashboardPanelsQuery.data?.length ?? 0,
		[EntityType.Network]: networksQuery.data?.length ?? 0,
		[EntityType.Room]: roomsQuery.data?.length ?? 0,
		[EntityType.RoomPeer]: roomPeersQuery.data?.length ?? 0,
		[EntityType.SharedAddress]: sharedAddressesQuery.data?.length ?? 0,
		[EntityType.SiweChallenge]: siweChallengesQuery.data?.length ?? 0,
		[EntityType.StorkPrice]: storkPricesQuery.data?.length ?? 0,
		[EntityType.SwapQuote]: swapQuotesQuery.data?.length ?? 0,
		[EntityType.TokenListCoin]: tokenListCoinsQuery.data?.length ?? 0,
		[EntityType.TransactionSession]: transactionSessionsQuery.data?.length ?? 0,
		[EntityType.TransactionSessionSimulation]:
			transactionSessionSimulationsQuery.data?.length ?? 0,
		[EntityType.TransferGraph]: transferGraphsQuery.data?.length ?? 0,
		[EntityType.TransferRequest]: transferRequestsQuery.data?.length ?? 0,
		[EntityType.UniswapPool]: uniswapPoolsQuery.data?.length ?? 0,
		[EntityType.UniswapPosition]: uniswapPositionsQuery.data?.length ?? 0,
		[EntityType.YellowChannel]: yellowChannelsQuery.data?.length ?? 0,
		[EntityType.YellowChannelState]: yellowChannelStatesQuery.data?.length ?? 0,
		[EntityType.YellowDeposit]: yellowDepositsQuery.data?.length ?? 0,
		[EntityType.YellowTransfer]: yellowTransfersQuery.data?.length ?? 0,
	})

	// Functions
	const isRecord = (value: unknown): value is Record<string, unknown> =>
		typeof value === 'object' && value !== null

	const getChainName = (chainId: number) =>
		networksByChainId[chainId]?.name ?? `Chain ${chainId}`

	const toNodeId = (prefix: string, id: unknown) => `${prefix}:${stringify(id)}`

	const toIntentPayload = (type: EntityType, id: Record<string, unknown>) => ({
		entity: {
			type,
			id,
		},
		context: {
			source: 'graph',
		},
	})

	// (Derived)
	const graphModel = $derived.by(() => {
		if (!visible) return null

		const take = <T>(a: T[] | undefined) =>
			(a ?? []).slice(0, GRAPH_SCENE_MAX_PER_COLLECTION)
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

		// Position nodes in rings by collection type
		const positionInRing = (ring: number, index: number, total: number) => {
			const baseRadius = 35 + ring * 30
			const angle = (index / Math.max(total, 1)) * Math.PI * 2 + ring * 0.3
			return {
				x: Math.cos(angle) * baseRadius + (Math.random() - 0.5) * 8,
				y: Math.sin(angle) * baseRadius + (Math.random() - 0.5) * 8,
			}
		}

		// Add wallet nodes (center)
		if (visibleCollections.has(EntityType.Wallet)) {
			const wallets = take(walletsQuery.data)
			wallets.forEach(({ row }, i) => {
				const rdns = row.$id?.rdns
				if (!rdns) return
				const pos = positionInRing(
					collections[EntityType.Wallet].ring,
					i,
					wallets.length,
				)
				addNode({
					id: `wallet:${rdns}`,
					label: row.name,
					...pos,
					size: collections[EntityType.Wallet].size,
					color: collections[EntityType.Wallet].color,
					type: row.icon ? 'image' : 'circle',
					image: row.icon || undefined,
					collection: EntityType.Wallet,
					g6Type: row.icon ? 'image' : collections[EntityType.Wallet].g6Type,
					g6Style: collections[EntityType.Wallet].g6Style,
					details: { rdns: row.rdns },
				})
			})
		}

		// Add connection nodes
		if (visibleCollections.has(EntityType.WalletConnection)) {
			const connections = take(connectionsQuery.data)
			connections.forEach(({ row }, i) => {
				const rdns = row.$id?.wallet$id?.rdns
				if (!rdns) return
				const connId = `connection:${rdns}`
				if (g.hasNode(connId)) return
				const pos = positionInRing(
					collections[EntityType.WalletConnection].ring,
					i,
					connections.length,
				)
				const statusColor =
					row.status === 'connected'
						? '#22c55e'
						: row.status === 'error'
							? '#ef4444'
							: '#f59e0b'
				const chainName = row.chainId ? getChainName(row.chainId) : null
				addNode({
					id: connId,
					label:
						row.status === 'connected'
							? `${row.actors.length} acct${row.actors.length !== 1 ? 's' : ''}${chainName ? ` · ${chainName}` : ''}`
							: row.status,
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
								row.status === 'connected'
									? 'ON'
									: row.status === 'error'
										? 'ERR'
										: 'OFF',
						},
					},
					disabled: row.status === 'error',
					details: {
						status: row.status,
						chainId: row.chainId,
						actors: row.actors.length,
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
			const actors = take(actorsQuery.data)
			const connections = take(connectionsQuery.data)
			actors.forEach(({ row }, i) => {
				const actorId = `actor:${row.$id.network}:${row.address}`
				if (g.hasNode(actorId)) return
				const pos = positionInRing(
					collections[EntityType.Actor].ring,
					i,
					actors.length,
				)
				const chainName = getChainName(row.$id.network)
				addNode({
					id: actorId,
					label: `${row.address.slice(0, 6)}…${row.address.slice(-4)}`,
					...pos,
					size: collections[EntityType.Actor].size,
					color: collections[EntityType.Actor].color,
					type: 'circle',
					collection: EntityType.Actor,
					g6Type: collections[EntityType.Actor].g6Type,
					g6Style: collections[EntityType.Actor].g6Style,
					intent: toIntentPayload(EntityType.Actor, row.$id),
					details: {
						address: row.address,
						chain: chainName,
						chainId: row.$id.network,
					},
				})
				// Connect actor to connection
				if (visibleCollections.has(EntityType.WalletConnection)) {
					for (const { row: conn } of connections) {
						if (conn.actors.includes(row.address)) {
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
			const coins = take(actorCoinsQuery.data)
			coins.forEach(({ row }, i) => {
				const coinId = `coin:${row.$id.chainId}:${row.$id.address}:${row.$id.tokenAddress}`
				if (g.hasNode(coinId)) return
				const pos = positionInRing(
					collections[EntityType.ActorCoin].ring,
					i,
					coins.length,
				)
				const hasBalance = row.balance > 0n
				const chainName = getChainName(row.$id.chainId)
				const balanceStr = hasBalance
					? formatSmallestToDecimal(row.balance, row.decimals, 2)
					: '0'
				addNode({
					id: coinId,
					label: `${balanceStr} ${row.symbol}`,
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
					g6Style: collections[EntityType.ActorCoin].g6Style,
					intent: toIntentPayload(EntityType.ActorCoin, row.$id),
					disabled: !hasBalance,
					details: {
						symbol: row.symbol,
						balance: balanceStr,
						chain: chainName,
						hasBalance,
					},
				})
				if (visibleCollections.has(EntityType.Actor)) {
					const actorId = `actor:${row.$id.chainId}:${row.$id.address}`
					if (g.hasNode(actorId)) {
						addEdge({
							id: `edge:${edgeIndex++}`,
							source: actorId,
							target: coinId,
							size: hasBalance ? 1.5 : 0.5,
							color: hasBalance
								? edgeColors.balance
								: `${edgeColors.balance}33`,
							type: 'curvedArrow',
							relation: 'balance',
							g6Style: edgeStyles.balance,
							disabled: !hasBalance,
						})
					}
				}
			})
		}

		// Add allowance nodes
		if (visibleCollections.has(EntityType.ActorAllowance)) {
			const allowances = take(allowancesQuery.data)
			allowances.forEach(({ row }, i) => {
				const allowanceId = `allowance:${row.$id.chainId}:${row.$id.address}:${row.$id.tokenAddress}:${row.$id.spenderAddress}`
				if (g.hasNode(allowanceId)) return
				const pos = positionInRing(
					collections[EntityType.ActorAllowance].ring,
					i,
					allowances.length,
				)
				const hasAllowance = row.allowance > 0n
				const chainName = getChainName(row.$id.chainId)
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
					g6Style: collections[EntityType.ActorAllowance].g6Style,
					disabled: !hasAllowance,
					details: {
						chain: chainName,
						approved: hasAllowance,
						spender: row.$id.spenderAddress.slice(0, 10) + '…',
					},
				})
				if (visibleCollections.has(EntityType.ActorCoin)) {
					const coinId = `coin:${row.$id.chainId}:${row.$id.address}:${row.$id.tokenAddress}`
					if (g.hasNode(coinId)) {
						addEdge({
							id: `edge:${edgeIndex++}`,
							source: coinId,
							target: allowanceId,
							size: hasAllowance ? 1 : 0.5,
							color: hasAllowance
								? edgeColors.allowance
								: `${edgeColors.allowance}33`,
							type: 'curvedArrow',
							relation: 'allowance',
							g6Style: edgeStyles.allowance,
							disabled: !hasAllowance,
						})
					}
				}
			})
		}

		// Add network nodes
		if (visibleCollections.has(EntityType.Network)) {
			const networks = take(networksQuery.data)
			networks.forEach(({ row }, i) => {
				const networkId = `network:${row.$id}`
				if (g.hasNode(networkId)) return
				const pos = positionInRing(
					collections[EntityType.Network].ring,
					i,
					networks.length,
				)
				addNode({
					id: networkId,
					label: row.name,
					...pos,
					size: collections[EntityType.Network].size,
					color: collections[EntityType.Network].color,
					type: 'circle',
					collection: EntityType.Network,
					g6Type: collections[EntityType.Network].g6Type,
					g6Style: collections[EntityType.Network].g6Style,
					details: {
						chainId: row.chainId,
						type: row.type,
						network: row.network,
					},
				})
			})
		}

		// Add route nodes
		if (visibleCollections.has(EntityType.BridgeRoute)) {
			const routes = take(routesQuery.data)
			routes.forEach(({ row }, i) => {
				const routeId = `route:${row.$id.routeId}`
				if (g.hasNode(routeId)) return
				const pos = positionInRing(
					collections[EntityType.BridgeRoute].ring,
					i,
					routes.length,
				)
				const fromChain = getChainName(row.fromChainId)
				const toChain = getChainName(row.toChainId)
				addNode({
					id: routeId,
					label: `${formatSmallestToDecimal(row.toAmount, 6, 4)} USDC`,
					...pos,
					size: collections[EntityType.BridgeRoute].size,
					color: collections[EntityType.BridgeRoute].color,
					type: 'circle',
					collection: EntityType.BridgeRoute,
					g6Type: collections[EntityType.BridgeRoute].g6Type,
					g6Style: collections[EntityType.BridgeRoute].g6Style,
					details: {
						from: fromChain,
						to: toChain,
						tools: [...new Set(row.steps.map((step) => step.toolName))].join(
							' → ',
						),
						duration: `${Math.ceil(row.estimatedDurationSeconds / 60)}m`,
						tags: row.tags.join(', '),
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					const fromNetworkId = `network:${row.fromChainId}`
					const toNetworkId = `network:${row.toChainId}`
					if (g.hasNode(fromNetworkId)) {
						addEdge({
							id: `edge:${edgeIndex++}`,
							source: fromNetworkId,
							target: routeId,
							size: 1.5,
							color: edgeColors.route,
							type: 'curvedArrow',
							relation: 'route',
							g6Style: edgeStyles.route,
						})
					}
					if (g.hasNode(toNetworkId)) {
						addEdge({
							id: `edge:${edgeIndex++}`,
							source: routeId,
							target: toNetworkId,
							size: 1.5,
							color: edgeColors.route,
							type: 'curvedArrow',
							relation: 'route',
							g6Style: edgeStyles.route,
						})
					}
				}
			})
		}

		// Add transaction nodes
		if (visibleCollections.has(EntityType.Transaction)) {
			const txs = take(txQuery.data)
			txs.forEach(({ row }, i) => {
				const txId = `tx:${row.$id.sourceTxHash}`
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
				const fromChain = getChainName(row.fromChainId)
				const toChain = getChainName(row.toChainId)
				addNode({
					id: txId,
					label: `${statusIcon[row.status]} ${fromChain} → ${toChain}`,
					...pos,
					size: collections[EntityType.Transaction].size,
					color:
						statusColors[row.status] ??
						collections[EntityType.Transaction].color,
					type: 'circle',
					collection: EntityType.Transaction,
					g6Type: collections[EntityType.Transaction].g6Type,
					g6Style: collections[EntityType.Transaction].g6Style,
					disabled: row.status === 'failed',
					details: {
						status: row.status,
						from: fromChain,
						to: toChain,
						hash: row.$id.sourceTxHash.slice(0, 10) + '…',
					},
				})
				if (visibleCollections.has(EntityType.Actor)) {
					const actorId = `actor:${row.fromChainId}:${row.$id.address}`
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
							disabled: row.status === 'failed',
						})
					}
				}
			})
		}

		// Add coin nodes
		if (visibleCollections.has(EntityType.Coin)) {
			const coins = take(coinsQuery.data)
			coins.forEach(({ row }, i) => {
				const coinId = `erc20:${row.$id.network}:${row.$id.address}`
				if (g.hasNode(coinId)) return
				const pos = positionInRing(
					collections[EntityType.Coin].ring,
					i,
					coins.length,
				)
				addNode({
					id: coinId,
					label: row.symbol,
					...pos,
					size: collections[EntityType.Coin].size,
					color: collections[EntityType.Coin].color,
					type: 'circle',
					collection: EntityType.Coin,
					g6Type: collections[EntityType.Coin].g6Type,
					g6Style: collections[EntityType.Coin].g6Style,
					intent: toIntentPayload(EntityType.Coin, row.$id),
					details: {
						address: row.$id.address,
						chainId: row.$id.network,
						symbol: row.symbol,
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					const networkId = `network:${row.$id.network}`
					if (g.hasNode(networkId)) {
						addEdge({
							id: `edge:${edgeIndex++}`,
							source: networkId,
							target: coinId,
							size: 1,
							color: edgeColors.coin,
							type: 'line',
							relation: 'coin',
							g6Style: edgeStyles.coin,
						})
					}
				}
			})
		}

		// Add token list coin nodes
		if (visibleCollections.has(EntityType.TokenListCoin)) {
			const tokens = take(tokenListCoinsQuery.data)
			tokens.forEach(({ row }, i) => {
				const tokenId = `token:${row.$id.chainId}:${row.$id.address}`
				if (g.hasNode(tokenId)) return
				const pos = positionInRing(
					collections[EntityType.TokenListCoin].ring,
					i,
					tokens.length,
				)
				addNode({
					id: tokenId,
					label: row.symbol,
					...pos,
					size: collections[EntityType.TokenListCoin].size,
					color: collections[EntityType.TokenListCoin].color,
					type: 'circle',
					collection: EntityType.TokenListCoin,
					g6Type: collections[EntityType.TokenListCoin].g6Type,
					g6Style: collections[EntityType.TokenListCoin].g6Style,
					intent: toIntentPayload(EntityType.TokenListCoin, row.$id),
					details: {
						address: row.$id.address,
						chainId: row.$id.chainId,
						symbol: row.symbol,
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					const networkId = `network:${row.$id.chainId}`
					if (g.hasNode(networkId)) {
						addEdge({
							id: `edge:${edgeIndex++}`,
							source: networkId,
							target: tokenId,
							size: 1,
							color: edgeColors.token,
							type: 'line',
							relation: 'token',
							g6Style: edgeStyles.token,
						})
					}
				}
			})
		}

		// Add stork price nodes
		if (visibleCollections.has(EntityType.StorkPrice)) {
			const prices = take(storkPricesQuery.data)
			prices.forEach(({ row }, i) => {
				const priceId = toNodeId('stork', row.$id)
				if (g.hasNode(priceId)) return
				const pos = positionInRing(
					collections[EntityType.StorkPrice].ring,
					i,
					prices.length,
				)
				addNode({
					id: priceId,
					label:
						row.assetId.length > 10
							? row.assetId.slice(0, 10)
							: row.assetId,
					...pos,
					size: collections[EntityType.StorkPrice].size,
					color: collections[EntityType.StorkPrice].color,
					type: 'circle',
					collection: EntityType.StorkPrice,
					g6Type: collections[EntityType.StorkPrice].g6Type,
					g6Style: collections[EntityType.StorkPrice].g6Style,
					disabled: row.isLoading || row.error !== null,
					details: {
						assetId: row.assetId,
						transport: row.transport,
						chainId: row.chainId,
						price: row.price.toString(),
					},
				})
				if (visibleCollections.has(EntityType.Network) && row.chainId) {
					const networkId = `network:${row.chainId}`
					if (g.hasNode(networkId)) {
						addEdge({
							id: `edge:${edgeIndex++}`,
							source: networkId,
							target: priceId,
							size: 1,
							color: edgeColors.stork,
							type: 'line',
							relation: 'stork',
							g6Style: edgeStyles.stork,
							disabled: row.isLoading || row.error !== null,
						})
					}
				}
			})
		}

		// Add swap quote nodes
		if (visibleCollections.has(EntityType.SwapQuote)) {
			const quotes = take(swapQuotesQuery.data)
			quotes.forEach(({ row }, i) => {
				const quoteId = `swap:${row.id}`
				if (g.hasNode(quoteId)) return
				const pos = positionInRing(
					collections[EntityType.SwapQuote].ring,
					i,
					quotes.length,
				)
				addNode({
					id: quoteId,
					label: `${row.tokenIn.slice(0, 6)}→${row.tokenOut.slice(0, 6)}`,
					...pos,
					size: collections[EntityType.SwapQuote].size,
					color: collections[EntityType.SwapQuote].color,
					type: 'rect',
					collection: EntityType.SwapQuote,
					g6Type: collections[EntityType.SwapQuote].g6Type,
					g6Style: collections[EntityType.SwapQuote].g6Style,
					details: {
						chainId: row.chainId,
						priceImpact: row.priceImpact,
						tokenIn: row.tokenIn,
						tokenOut: row.tokenOut,
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					const networkId = `network:${row.chainId}`
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
			const pools = take(uniswapPoolsQuery.data)
			pools.forEach(({ row }, i) => {
				const poolId = `pool:${row.id}`
				if (g.hasNode(poolId)) return
				const pos = positionInRing(
					collections[EntityType.UniswapPool].ring,
					i,
					pools.length,
				)
				addNode({
					id: poolId,
					label: `${row.token0.slice(0, 6)} / ${row.token1.slice(0, 6)}`,
					...pos,
					size: collections[EntityType.UniswapPool].size,
					color: collections[EntityType.UniswapPool].color,
					type: 'rect',
					collection: EntityType.UniswapPool,
					g6Type: collections[EntityType.UniswapPool].g6Type,
					g6Style: collections[EntityType.UniswapPool].g6Style,
					details: {
						chainId: row.chainId,
						fee: row.fee,
						hooks: row.hooks,
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					const networkId = `network:${row.chainId}`
					if (g.hasNode(networkId)) {
						addEdge({
							id: `edge:${edgeIndex++}`,
							source: networkId,
							target: poolId,
							size: 1.5,
							color: edgeColors.pool,
							type: 'line',
							relation: 'pool',
							g6Style: edgeStyles.pool,
						})
					}
				}
			})
		}

		// Add uniswap position nodes
		if (visibleCollections.has(EntityType.UniswapPosition)) {
			const positions = take(uniswapPositionsQuery.data)
			positions.forEach(({ row }, i) => {
				const positionId = `position:${row.id}`
				if (g.hasNode(positionId)) return
				const pos = positionInRing(
					collections[EntityType.UniswapPosition].ring,
					i,
					positions.length,
				)
				addNode({
					id: positionId,
					label: `Pos ${row.owner.slice(0, 6)}…`,
					...pos,
					size: collections[EntityType.UniswapPosition].size,
					color: collections[EntityType.UniswapPosition].color,
					type: 'rect',
					collection: EntityType.UniswapPosition,
					g6Type: collections[EntityType.UniswapPosition].g6Type,
					g6Style: collections[EntityType.UniswapPosition].g6Style,
					details: {
						chainId: row.chainId,
						poolId: row.poolId,
						owner: row.owner,
					},
				})
				const poolId = `pool:${row.poolId}`
				if (g.hasNode(poolId)) {
					addEdge({
						id: `edge:${edgeIndex++}`,
						source: poolId,
						target: positionId,
						size: 1.2,
						color: edgeColors.position,
						type: 'curvedArrow',
						relation: 'position',
						g6Style: edgeStyles.position,
					})
				}
			})
		}

		// Add CCTP allowance nodes
		if (visibleCollections.has(EntityType.CctpAllowance)) {
			const allowances = take(cctpAllowanceQuery.data)
			allowances.forEach(({ row }, i) => {
				const allowanceId = toNodeId('cctp-allowance', row.$id)
				if (g.hasNode(allowanceId)) return
				const pos = positionInRing(
					collections[EntityType.CctpAllowance].ring,
					i,
					allowances.length,
				)
				addNode({
					id: allowanceId,
					label:
						row.allowance === null
							? 'Allowance n/a'
							: `Allowance ${row.allowance}`,
					...pos,
					size: collections[EntityType.CctpAllowance].size,
					color: collections[EntityType.CctpAllowance].color,
					type: 'rect',
					collection: EntityType.CctpAllowance,
					g6Type: collections[EntityType.CctpAllowance].g6Type,
					g6Style: collections[EntityType.CctpAllowance].g6Style,
					disabled: row.isLoading || row.error !== null,
					details: {
						apiHost: row.$id.apiHost,
						lastUpdated: row.lastUpdated,
						error: row.error,
					},
				})
			})
		}

		// Add CCTP fee nodes
		if (visibleCollections.has(EntityType.CctpFee)) {
			const fees = take(cctpFeesQuery.data)
			fees.forEach(({ row }, i) => {
				const feeId = toNodeId('cctp-fee', row.$id)
				if (g.hasNode(feeId)) return
				const pos = positionInRing(
					collections[EntityType.CctpFee].ring,
					i,
					fees.length,
				)
				addNode({
					id: feeId,
					label: `${row.$id.fromDomain}→${row.$id.toDomain}`,
					...pos,
					size: collections[EntityType.CctpFee].size,
					color: collections[EntityType.CctpFee].color,
					type: 'rect',
					collection: EntityType.CctpFee,
					g6Type: collections[EntityType.CctpFee].g6Type,
					g6Style: collections[EntityType.CctpFee].g6Style,
					disabled: row.isLoading || row.error !== null,
					details: {
						apiHost: row.$id.apiHost,
						rows: row.rows.length,
						error: row.error,
					},
				})
			})
		}

		// Add transaction session nodes
		if (visibleCollections.has(EntityType.TransactionSession)) {
			const sessions = take(transactionSessionsQuery.data)
			sessions.forEach(({ row }, i) => {
				const sessionId = `session:${row.id}`
				if (g.hasNode(sessionId)) return
				const pos = positionInRing(
					collections[EntityType.TransactionSession].ring,
					i,
					sessions.length,
				)
				addNode({
					id: sessionId,
					label: `Session ${row.id.slice(0, 6)}`,
					...pos,
					size: collections[EntityType.TransactionSession].size,
					color: collections[EntityType.TransactionSession].color,
					type: 'rect',
					collection: EntityType.TransactionSession,
					g6Type: collections[EntityType.TransactionSession].g6Type,
					g6Style: collections[EntityType.TransactionSession].g6Style,
					disabled: row.status === 'Finalized',
					details: {
						status: row.status,
						actions: row.actions.join(', '),
						simulations: row.simulationCount ?? 0,
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					if (row.execution?.chainId) {
						const networkId = `network:${row.execution.chainId}`
						if (g.hasNode(networkId)) {
							addEdge({
								id: `edge:${edgeIndex++}`,
								source: networkId,
								target: sessionId,
								size: 1.5,
								color: edgeColors.session,
								type: 'curvedArrow',
								relation: 'session',
								g6Style: edgeStyles.session,
							})
						}
					}
				}
			})
		}

		// Add transaction session simulation nodes
		if (visibleCollections.has(EntityType.TransactionSessionSimulation)) {
			const simulations = take(transactionSessionSimulationsQuery.data)
			simulations.forEach(({ row }, i) => {
				const simulationId = `simulation:${row.id}`
				if (g.hasNode(simulationId)) return
				const pos = positionInRing(
					collections[EntityType.TransactionSessionSimulation].ring,
					i,
					simulations.length,
				)
				addNode({
					id: simulationId,
					label: `Sim ${row.id.slice(0, 6)}`,
					...pos,
					size: collections[EntityType.TransactionSessionSimulation].size,
					color: collections[EntityType.TransactionSessionSimulation].color,
					type: 'rect',
					collection: EntityType.TransactionSessionSimulation,
					g6Type: collections[EntityType.TransactionSessionSimulation].g6Type,
					g6Style: collections[EntityType.TransactionSessionSimulation].g6Style,
					disabled: row.status === 'failed',
					details: {
						status: row.status,
						sessionId: row.sessionId,
					},
				})
				const sessionId = `session:${row.sessionId}`
				if (g.hasNode(sessionId)) {
					addEdge({
						id: `edge:${edgeIndex++}`,
						source: sessionId,
						target: simulationId,
						size: 1,
						color: edgeColors.simulation,
						type: 'curvedArrow',
						relation: 'simulation',
						g6Style: edgeStyles.simulation,
						disabled: row.status === 'failed',
					})
				}
			})
		}

		// Add transfer graph nodes
		if (visibleCollections.has(EntityType.TransferGraph)) {
			const graphs = take(transferGraphsQuery.data)
			graphs.forEach(({ row }, i) => {
				const graphId = `transfer-graph:${row.$id.period}`
				if (g.hasNode(graphId)) return
				const pos = positionInRing(
					collections[EntityType.TransferGraph].ring,
					i,
					graphs.length,
				)
				addNode({
					id: graphId,
					label: row.period,
					...pos,
					size: collections[EntityType.TransferGraph].size,
					color: collections[EntityType.TransferGraph].color,
					type: 'rect',
					collection: EntityType.TransferGraph,
					g6Type: collections[EntityType.TransferGraph].g6Type,
					g6Style: collections[EntityType.TransferGraph].g6Style,
					disabled: row.isLoading || row.error !== null,
					details: {
						nodes: row.graph.nodes.length,
						edges: row.graph.edges.length,
						error: row.error,
					},
				})
			})
		}

		// Add room nodes
		if (visibleCollections.has(EntityType.Room)) {
			const rooms = take(roomsQuery.data)
			rooms.forEach(({ row }, i) => {
				const roomId = `room:${row.id}`
				if (g.hasNode(roomId)) return
				const pos = positionInRing(
					collections[EntityType.Room].ring,
					i,
					rooms.length,
				)
				addNode({
					id: roomId,
					label: row.name ?? row.id,
					...pos,
					size: collections[EntityType.Room].size,
					color: collections[EntityType.Room].color,
					type: 'rect',
					collection: EntityType.Room,
					g6Type: collections[EntityType.Room].g6Type,
					g6Style: collections[EntityType.Room].g6Style,
					details: {
						createdBy: row.createdBy,
						createdAt: row.createdAt,
					},
				})
			})
		}

		// Add room peer nodes
		if (visibleCollections.has(EntityType.RoomPeer)) {
			const peers = take(roomPeersQuery.data)
			peers.forEach(({ row }, i) => {
				const peerId = `peer:${row.id}`
				if (g.hasNode(peerId)) return
				const pos = positionInRing(
					collections[EntityType.RoomPeer].ring,
					i,
					peers.length,
				)
				addNode({
					id: peerId,
					label: row.displayName ?? row.peerId,
					...pos,
					size: collections[EntityType.RoomPeer].size,
					color: collections[EntityType.RoomPeer].color,
					type: 'circle',
					collection: EntityType.RoomPeer,
					g6Type: collections[EntityType.RoomPeer].g6Type,
					g6Style: collections[EntityType.RoomPeer].g6Style,
					disabled: !row.isConnected,
					details: {
						roomId: row.roomId,
						peerId: row.peerId,
						connected: row.isConnected,
					},
				})
				const roomId = `room:${row.roomId}`
				if (g.hasNode(roomId)) {
					addEdge({
						id: `edge:${edgeIndex++}`,
						source: roomId,
						target: peerId,
						size: 1,
						color: edgeColors.peer,
						type: 'curvedArrow',
						relation: 'peer',
						g6Style: edgeStyles.peer,
						disabled: !row.isConnected,
					})
				}
			})
		}

		// Add shared address nodes
		if (visibleCollections.has(EntityType.SharedAddress)) {
			const shared = take(sharedAddressesQuery.data)
			shared.forEach(({ row }, i) => {
				const sharedId = `shared:${row.id}`
				if (g.hasNode(sharedId)) return
				const pos = positionInRing(
					collections[EntityType.SharedAddress].ring,
					i,
					shared.length,
				)
				addNode({
					id: sharedId,
					label: row.address.slice(0, 10) + '…',
					...pos,
					size: collections[EntityType.SharedAddress].size,
					color: collections[EntityType.SharedAddress].color,
					type: 'circle',
					collection: EntityType.SharedAddress,
					g6Type: collections[EntityType.SharedAddress].g6Type,
					g6Style: collections[EntityType.SharedAddress].g6Style,
					details: {
						roomId: row.roomId,
						peerId: row.peerId,
						verifiedBy: row.verifiedBy.length,
					},
				})
				const roomId = `room:${row.roomId}`
				if (g.hasNode(roomId)) {
					addEdge({
						id: `edge:${edgeIndex++}`,
						source: roomId,
						target: sharedId,
						size: 1,
						color: edgeColors.shared,
						type: 'line',
						relation: 'shared',
						g6Style: edgeStyles.shared,
					})
				}
			})
		}

		// Add SIWE challenge nodes
		if (visibleCollections.has(EntityType.SiweChallenge)) {
			const challenges = take(siweChallengesQuery.data)
			challenges.forEach(({ row }, i) => {
				const challengeId = `siwe:${row.id}`
				if (g.hasNode(challengeId)) return
				const pos = positionInRing(
					collections[EntityType.SiweChallenge].ring,
					i,
					challenges.length,
				)
				addNode({
					id: challengeId,
					label: `SIWE ${row.address.slice(0, 6)}…`,
					...pos,
					size: collections[EntityType.SiweChallenge].size,
					color: collections[EntityType.SiweChallenge].color,
					type: 'rect',
					collection: EntityType.SiweChallenge,
					g6Type: collections[EntityType.SiweChallenge].g6Type,
					g6Style: collections[EntityType.SiweChallenge].g6Style,
					disabled: !row.verified,
					details: {
						roomId: row.roomId,
						address: row.address,
						verified: row.verified,
					},
				})
				const roomId = `room:${row.roomId}`
				if (g.hasNode(roomId)) {
					addEdge({
						id: `edge:${edgeIndex++}`,
						source: roomId,
						target: challengeId,
						size: 1,
						color: edgeColors.siwe,
						type: 'curvedArrow',
						relation: 'siwe',
						g6Style: edgeStyles.siwe,
						disabled: !row.verified,
					})
				}
			})
		}

		// Add transfer request nodes
		if (visibleCollections.has(EntityType.TransferRequest)) {
			const requests = transferRequestsQuery.data ?? []
			requests.forEach(({ row }, i) => {
				const requestId = `transfer-request:${row.id}`
				if (g.hasNode(requestId)) return
				const pos = positionInRing(
					collections[EntityType.TransferRequest].ring,
					i,
					requests.length,
				)
				const disabled =
					row.status === 'rejected' || row.status === 'expired'
				addNode({
					id: requestId,
					label: `Request ${row.status}`,
					...pos,
					size: collections[EntityType.TransferRequest].size,
					color: collections[EntityType.TransferRequest].color,
					type: 'rect',
					collection: EntityType.TransferRequest,
					g6Type: collections[EntityType.TransferRequest].g6Type,
					g6Style: collections[EntityType.TransferRequest].g6Style,
					disabled,
					details: {
						from: row.from,
						to: row.to,
						allocations: row.allocations.length,
					},
				})
				const roomId = `room:${row.roomId}`
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
		if (visibleCollections.has(EntityType.YellowChannel)) {
			const channels = take(yellowChannelsQuery.data)
			channels.forEach(({ row }, i) => {
				const channelId = `yellow:${row.id}`
				if (g.hasNode(channelId)) return
				const pos = positionInRing(
					collections[EntityType.YellowChannel].ring,
					i,
					channels.length,
				)
				addNode({
					id: channelId,
					label: `Channel ${row.id.slice(0, 6)}`,
					...pos,
					size: collections[EntityType.YellowChannel].size,
					color: collections[EntityType.YellowChannel].color,
					type: 'rect',
					collection: EntityType.YellowChannel,
					g6Type: collections[EntityType.YellowChannel].g6Type,
					g6Style: collections[EntityType.YellowChannel].g6Style,
					disabled: row.status === 'closed',
					details: {
						status: row.status,
						chainId: row.chainId,
						asset: row.asset,
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					const networkId = `network:${row.chainId}`
					if (g.hasNode(networkId)) {
						addEdge({
							id: `edge:${edgeIndex++}`,
							source: networkId,
							target: channelId,
							size: 1.5,
							color: edgeColors.yellow,
							type: 'curvedArrow',
							relation: 'yellow',
							g6Style: edgeStyles.yellow,
							disabled: row.status === 'closed',
						})
					}
				}
			})
		}

		// Add yellow channel state nodes
		if (visibleCollections.has(EntityType.YellowChannelState)) {
			const states = take(yellowChannelStatesQuery.data)
			states.forEach(({ row }, i) => {
				const stateId = `yellow-state:${row.id}`
				if (g.hasNode(stateId)) return
				const pos = positionInRing(
					collections[EntityType.YellowChannelState].ring,
					i,
					states.length,
				)
				addNode({
					id: stateId,
					label: `State v${row.version}`,
					...pos,
					size: collections[EntityType.YellowChannelState].size,
					color: collections[EntityType.YellowChannelState].color,
					type: 'rect',
					collection: EntityType.YellowChannelState,
					g6Type: collections[EntityType.YellowChannelState].g6Type,
					g6Style: collections[EntityType.YellowChannelState].g6Style,
					disabled: row.isFinal,
					details: {
						channelId: row.channelId,
						intent: row.intent,
						isFinal: row.isFinal,
					},
				})
				const channelId = `yellow:${row.channelId}`
				if (g.hasNode(channelId)) {
					addEdge({
						id: `edge:${edgeIndex++}`,
						source: channelId,
						target: stateId,
						size: 1,
						color: edgeColors.yellow,
						type: 'curvedArrow',
						relation: 'yellow',
						g6Style: edgeStyles.yellow,
						disabled: row.isFinal,
					})
				}
			})
		}

		// Add yellow deposit nodes
		if (visibleCollections.has(EntityType.YellowDeposit)) {
			const deposits = take(yellowDepositsQuery.data)
			deposits.forEach(({ row }, i) => {
				const depositId = `yellow-deposit:${row.id}`
				if (g.hasNode(depositId)) return
				const pos = positionInRing(
					collections[EntityType.YellowDeposit].ring,
					i,
					deposits.length,
				)
				addNode({
					id: depositId,
					label: `Deposit ${row.address.slice(0, 6)}…`,
					...pos,
					size: collections[EntityType.YellowDeposit].size,
					color: collections[EntityType.YellowDeposit].color,
					type: 'circle',
					collection: EntityType.YellowDeposit,
					g6Type: collections[EntityType.YellowDeposit].g6Type,
					g6Style: collections[EntityType.YellowDeposit].g6Style,
					details: {
						chainId: row.chainId,
						available: row.availableBalance.toString(),
						locked: row.lockedBalance.toString(),
					},
				})
				if (visibleCollections.has(EntityType.Network)) {
					const networkId = `network:${row.chainId}`
					if (g.hasNode(networkId)) {
						addEdge({
							id: `edge:${edgeIndex++}`,
							source: networkId,
							target: depositId,
							size: 1,
							color: edgeColors.yellow,
							type: 'line',
							relation: 'yellow',
							g6Style: edgeStyles.yellow,
						})
					}
				}
			})
		}

		// Add yellow transfer nodes
		if (visibleCollections.has(EntityType.YellowTransfer)) {
			const transfers = take(yellowTransfersQuery.data)
			transfers.forEach(({ row }, i) => {
				const transferId = `yellow-transfer:${row.id}`
				if (g.hasNode(transferId)) return
				const pos = positionInRing(
					collections[EntityType.YellowTransfer].ring,
					i,
					transfers.length,
				)
				addNode({
					id: transferId,
					label: `${row.status} transfer`,
					...pos,
					size: collections[EntityType.YellowTransfer].size,
					color: collections[EntityType.YellowTransfer].color,
					type: 'circle',
					collection: EntityType.YellowTransfer,
					g6Type: collections[EntityType.YellowTransfer].g6Type,
					g6Style: collections[EntityType.YellowTransfer].g6Style,
					disabled: row.status === 'failed',
					details: {
						channelId: row.channelId,
						amount: row.amount.toString(),
						status: row.status,
					},
				})
				const channelId = `yellow:${row.channelId}`
				if (g.hasNode(channelId)) {
					addEdge({
						id: `edge:${edgeIndex++}`,
						source: channelId,
						target: transferId,
						size: 1,
						color: edgeColors.yellow,
						type: 'curvedArrow',
						relation: 'yellow',
						g6Style: edgeStyles.yellow,
						disabled: row.status === 'failed',
					})
				}
			})
		}

		// Add dashboard panel nodes
		if (visibleCollections.has(EntityType.DashboardPanel)) {
			const panels = take(dashboardPanelsQuery.data)
			panels.forEach(({ row }, i) => {
				const panelId = toNodeId('dashboard', row.$id)
				if (g.hasNode(panelId)) return
				const pos = positionInRing(
					collections[EntityType.DashboardPanel].ring,
					i,
					panels.length,
				)
				addNode({
					id: panelId,
					label: `Dashboard ${row.$id.id}`,
					...pos,
					size: collections[EntityType.DashboardPanel].size,
					color: collections[EntityType.DashboardPanel].color,
					type: 'rect',
					collection: EntityType.DashboardPanel,
					g6Type: collections[EntityType.DashboardPanel].g6Type,
					g6Style: collections[EntityType.DashboardPanel].g6Style,
					details: {
						focusedPanelId: row.focusedPanelId,
					},
				})
			})
		}

		return { graph: g, nodes, edges }
	})

	// (Derived)
	const highlightedNodes = $derived.by(() => {
		const nodes: string[] = []
		for (const entry of liveQueryCtx.stack) {
			for (const item of entry.query.data ?? []) {
				const row = isRecord(item) && 'row' in item ? item.row : null
				if (!isRecord(row) || !('$id' in row)) continue
				const rowId = row.$id
				if (!isRecord(rowId)) continue

				if ('rdns' in rowId && !('wallet$id' in rowId)) {
					const rdns = rowId.rdns
					if (typeof rdns === 'string' && rdns) nodes.push(`wallet:${rdns}`)
				} else if ('wallet$id' in rowId) {
					const walletId = rowId.wallet$id
					const rdns =
						isRecord(walletId) && typeof walletId.rdns === 'string'
							? walletId.rdns
							: ''
					if (rdns) nodes.push(`connection:${rdns}`)
				} else if ('network' in rowId && 'address' in rowId) {
					const network = rowId.network
					const address = rowId.address
					if (typeof network === 'number' && typeof address === 'string') {
						nodes.push(`actor:${network}:${address}`)
					}
				} else if ('chainId' in rowId && 'tokenAddress' in rowId) {
					const chainId = rowId.chainId
					const address = rowId.address
					const tokenAddress = rowId.tokenAddress
					if (
						typeof chainId === 'number' &&
						typeof address === 'string' &&
						typeof tokenAddress === 'string'
					) {
						if (
							'spenderAddress' in rowId &&
							typeof rowId.spenderAddress === 'string'
						) {
							nodes.push(
								`allowance:${chainId}:${address}:${tokenAddress}:${rowId.spenderAddress}`,
							)
						} else {
							nodes.push(`coin:${chainId}:${address}:${tokenAddress}`)
						}
					}
				} else if ('routeId' in rowId && 'quote' in rowId) {
					const routeId = rowId.routeId
					if (
						typeof routeId === 'string' &&
						routeId
					) {
						nodes.push(`route:${routeId}`)
					}
				} else if ('sourceTxHash' in rowId) {
					const sourceTxHash = rowId.sourceTxHash
					if (typeof sourceTxHash === 'string') {
						nodes.push(`tx:${sourceTxHash}`)
					}
				}
			}
		}
		return nodes
	})

	const highlightedSet = $derived(new Set(highlightedNodes))

	// (Derived)
	const selectedNodeSet = $derived(new Set(selectedNodes))
	const selectedEdgeSet = $derived(new Set(selectedEdges))

	const nodeReducer = (
		node: string,
		data: Attributes,
	): Partial<DisplayData> => {
		const isHighlighted = highlightedSet.has(node)
		const isSelected = selectedNodeSet.has(node)
		const isHovered = hoveredNode === node
		const color = typeof data.color === 'string' ? data.color : '#888888'
		const size = typeof data.size === 'number' ? data.size : 5
		return {
			...data,
			color: isHighlighted || isHovered || isSelected ? color : `${color}25`,
			size: isHovered
				? size * 1.8
				: isSelected
					? size * 1.4
					: isHighlighted
						? size * 1.2
						: size * 0.7,
			zIndex: isHovered ? 2 : isSelected ? 1.5 : isHighlighted ? 1 : 0,
		}
	}

	const edgeReducer = (
		edge: string,
		data: Attributes,
	): Partial<DisplayData> => {
		const source = graphModel?.graph.source(edge)
		const target = graphModel?.graph.target(edge)
		const isHighlighted =
			(source && highlightedSet.has(source)) ||
			(target && highlightedSet.has(target))
		const isSelected = selectedEdgeSet.has(edge)
		const isHovered =
			(source && hoveredNode === source) || (target && hoveredNode === target)
		const color = typeof data.color === 'string' ? data.color : '#888888'
		const size = typeof data.size === 'number' ? data.size : 1
		return {
			...data,
			color: isHighlighted || isHovered || isSelected ? color : `${color}10`,
			size: isHovered
				? size * 2
				: isSelected
					? size * 1.7
					: isHighlighted
						? size * 1.5
						: size * 0.4,
		}
	}

	// (Derived)
	const hoveredNodeData = $derived(
		hoveredNode && graphModel
			? graphModel.graph.getNodeAttributes(hoveredNode)
			: null,
	)
	const hoveredNodeEntries = $derived.by(() => {
		const details = hoveredNodeData?.details
		return isRecord(details) ? Object.entries(details) : []
	})
	const selectionCount = $derived(selectedNodes.length + selectedEdges.length)
	const selectionAnnouncement = $derived.by(() => {
		const count = selectionCount
		if (count === 0) return 'Selection cleared'
		const nodeCount = selectedNodes.length
		const edgeCount = selectedEdges.length
		const nodeLabel =
			nodeCount > 0 ? `${nodeCount} node${nodeCount === 1 ? '' : 's'}` : ''
		const edgeLabel =
			edgeCount > 0 ? `${edgeCount} edge${edgeCount === 1 ? '' : 's'}` : ''
		return `Selected ${nodeLabel}${nodeLabel && edgeLabel ? ' and ' : ''}${edgeLabel}`
	})
	const selectionItems = $derived.by(() => {
		if (!graphModel) return []
		const items = selectedNodes.map((nodeId) => {
			const attrs = graphModel.graph.getNodeAttributes(nodeId)
			const label = typeof attrs.label === 'string' ? attrs.label : nodeId
			const collection =
				typeof attrs.collection === 'string' ? attrs.collection : 'node'
			return { id: nodeId, kind: 'node', label, collection }
		})
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
	})

	// Actions
	const toggleCollection = (key: string) => {
		const next = new Set(visibleCollections)
		if (next.has(key)) next.delete(key)
		else next.add(key)
		visibleCollections = next
	}

	// (Derived)
	const refreshKey = $derived(
		[
			walletsQuery.data?.length,
			connectionsQuery.data?.length,
			actorsQuery.data?.length,
			actorCoinsQuery.data?.length,
			allowancesQuery.data?.length,
			routesQuery.data?.length,
			txQuery.data?.length,
			cctpAllowanceQuery.data?.length,
			cctpFeesQuery.data?.length,
			networksQuery.data?.length,
			coinsQuery.data?.length,
			tokenListCoinsQuery.data?.length,
			storkPricesQuery.data?.length,
			swapQuotesQuery.data?.length,
			uniswapPoolsQuery.data?.length,
			uniswapPositionsQuery.data?.length,
			transactionSessionsQuery.data?.length,
			transactionSessionSimulationsQuery.data?.length,
			transferGraphsQuery.data?.length,
			transferRequestsQuery.data?.length,
			roomsQuery.data?.length,
			roomPeersQuery.data?.length,
			sharedAddressesQuery.data?.length,
			siweChallengesQuery.data?.length,
			yellowChannelsQuery.data?.length,
			yellowChannelStatesQuery.data?.length,
			yellowDepositsQuery.data?.length,
			yellowTransfersQuery.data?.length,
			dashboardPanelsQuery.data?.length,
			[...visibleCollections].join(','),
		].join(':'),
	)
</script>

{#if visible && graphModel}
	<details
		class="graph-scene"
		data-card="secondary padding-0 radius-6"
		bind:open={expanded}
	>
		<summary
			class="graph-scene-header"
			data-row="gap-2 align-center"
		>
			<h4 data-row-item="flexible">Data Graph</h4>
			<div
				class="graph-scene-framework"
				data-row="gap-1"
				role="group"
				aria-label="Graph framework"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
			>
				<button
					type="button"
					data-active={graphFramework === 'sigma'}
					aria-pressed={graphFramework === 'sigma'}
					onclick={() => {
						graphFramework = 'sigma'
					}}
				>
					Sigma
				</button>
				<button
					type="button"
					data-active={graphFramework === 'g6'}
					aria-pressed={graphFramework === 'g6'}
					onclick={() => {
						graphFramework = 'g6'
					}}
				>
					G6
				</button>
			</div>
			<div
				class="graph-scene-stats"
				data-row="gap-1"
			>
				{graphModel.graph.order} nodes · {graphModel.graph.size} edges
				{#if highlightedSet.size > 0}
					<span class="graph-scene-highlight">
						· {highlightedNodes.length} active
					</span>
				{/if}
			</div>
		</summary>

		<div class="graph-scene-container">
				{#if graphFramework === 'g6'}
					<G6GraphView
						model={graphModel}
						{refreshKey}
						{highlightedNodes}
						{selectedNodes}
						{selectedEdges}
						{selectionCount}
						onSelectionChange={({ nodes, edges }) => {
							selectedNodes = nodes
							selectedEdges = edges
						}}
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
							selectedNodes = [node]
							selectedEdges = []
						}}
						onEdgeClick={(edge) => {
							selectedEdges = [edge]
							selectedNodes = []
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

		<footer class="graph-scene-footer">
			<div
				class="graph-scene-legend"
				data-row="wrap gap-1"
			>
				{#each Object.entries(collections) as [key, config] (key)}
					{@const entityType = key}
					{@const count = counts[entityType]}
					<button
						type="button"
						style="--color: {config.color}"
						data-active={visibleCollections.has(entityType)}
						onclick={() => toggleCollection(entityType)}
					>
						<span class="graph-scene-dot"></span>
						{config.label}
						{#if count > 0}
							<span class="graph-scene-count">{count}</span>
						{/if}
					</button>
				{/each}
			</div>
			{#if selectionItems.length > 0}
				<div
					class="graph-scene-selection"
					data-column="gap-2"
				>
					<h5>Selection</h5>
					<ul data-column="gap-1">
						{#each selectionItems as item (item.id)}
							<li>
								<button
									type="button"
									data-kind={item.kind}
									data-row="gap-2 align-center"
									onclick={() => {
										if (item.kind === 'node') {
											selectedNodes = [item.id]
											selectedEdges = []
											hoveredNode = item.id
										} else {
											selectedEdges = [item.id]
											selectedNodes = []
										}
									}}
								>
									<strong data-row-item="flexible">{item.label}</strong>
									<span>{item.collection}</span>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</footer>
	</details>
{/if}

<style>
	details.graph-scene {
		--graph-scene-canvas-bg: linear-gradient(
			145deg,
			#f8fafc 0%,
			#f1f5f9 50%,
			#e2e8f0 100%
		);
		--graph-scene-hover-bg: rgba(255, 255, 255, 0.97);
		--graph-scene-hover-border: rgba(0, 0, 0, 0.06);
		--graph-scene-details-border: rgba(0, 0, 0, 0.06);
		--graph-scene-legend-active-bg: color-mix(in srgb, var(--color) 8%, white);
		--graph-scene-legend-count-bg: color-mix(in srgb, var(--color) 15%, white);
		--graph-scene-framework-active-bg: var(--color-text);
		--graph-scene-framework-active-border: var(--color-text);
		--graph-scene-framework-active-fg: var(--color-text-inverted);

		position: fixed;
		bottom: 1rem;
		left: var(--safeArea-insetLeft);
		right: var(--safeArea-insetRight);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
		display: flex;
		flex-direction: column;
		z-index: 50;
		transition: height 0.2s ease;

		@media not (max-width: 1024px) {
			left: calc(
				var(--safeArea-insetLeft) + var(--navigation-desktop-inlineSize) +
					var(--separator-width)
			);
		}

		&[open] {
			height: 380px;
		}

		&:not([open]) {
			height: auto;
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
			}
		}

		&:not([open]) > summary::before {
			content: '▲';
		}

		> .graph-scene-container {
			flex: 1;
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
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
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

		> footer {
			padding: 0.5rem 0.625rem;
			border-top: 1px solid var(--color-border);
			background: var(--color-bg-subtle);
			border-radius: 0 0 0.75rem 0.75rem;

			> .graph-scene-legend {
				> button[data-active='true'] {
					background: var(--graph-scene-legend-active-bg);
					border-color: color-mix(in srgb, var(--color) 30%, transparent);
				}

				> button .graph-scene-dot {
					width: 6px;
					height: 6px;
					border-radius: 50%;
					background: var(--color);
				}

				> button .graph-scene-count {
					font-size: 0.5625rem;
					font-weight: 600;
					background: var(--graph-scene-legend-count-bg);
					color: var(--color);
					padding: 0.0625rem 0.25rem;
					border-radius: 0.75rem;
					min-width: 1rem;
					text-align: center;
				}
			}

			> .graph-scene-selection {
				margin-top: 0.5rem;
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

					strong {
						font-weight: 600;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}

					span {
						opacity: 0.5;
						font-size: 0.5625rem;
						text-transform: uppercase;
						letter-spacing: 0.04em;
					}
				}
			}
		}
	}

	@media (prefers-color-scheme: dark) {
		details.graph-scene {
			--graph-scene-canvas-bg: linear-gradient(
				145deg,
				#1e293b 0%,
				#0f172a 50%,
				#020617 100%
			);
			--graph-scene-hover-bg: rgba(30, 41, 59, 0.97);
			--graph-scene-hover-border: rgba(255, 255, 255, 0.06);
			--graph-scene-details-border: rgba(255, 255, 255, 0.06);
			--graph-scene-legend-active-bg: color-mix(in srgb, var(--color) 15%, #1e293b);
			--graph-scene-legend-count-bg: color-mix(in srgb, var(--color) 20%, #1e293b);
			--graph-scene-framework-active-bg: var(--color-border);
			--graph-scene-framework-active-border: var(--color-border);
			--graph-scene-framework-active-fg: var(--color-text);
		}
	}
</style>
