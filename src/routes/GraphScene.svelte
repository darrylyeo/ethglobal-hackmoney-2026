<script lang="ts">
	// Types/constants
	import type { Attributes } from 'graphology-types'
	import type { DisplayData } from 'sigma/types'
	import type {
		GraphEdge,
		GraphFramework,
		GraphModel,
		GraphNode,
	} from '$/lib/graph-model'
	import { EntityType, GRAPH_SCENE_ENTITY_TYPES } from '$/data/$EntityType'
	import { DataSource } from '$/constants/data-sources'
	import { networksByChainId } from '$/constants/networks'
	import { walletsCollection } from '$/collections/wallets'
	import { walletConnectionsCollection } from '$/collections/wallet-connections'
	import { actorsCollection } from '$/collections/actors'
	import { actorCoinsCollection } from '$/collections/actor-coins'
	import { actorAllowancesCollection } from '$/collections/actor-allowances'
	import { bridgeRoutesCollection } from '$/collections/bridge-routes'
	import { transactionsCollection } from '$/collections/transactions'

	// Context
	import { browser } from '$app/environment'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { useLiveQueryContext } from '$/svelte/live-query-context.svelte'

	// Functions
	import Graph from 'graphology'
	import { formatSmallestToDecimal } from '$/lib/format'

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
		new Set(GRAPH_SCENE_ENTITY_TYPES),
	)
	let graphFramework = $state<GraphFramework>('sigma')
	let frameworkHydrated = $state(false)
	let selectedNodes = $state<string[]>([])
	let selectedEdges = $state<string[]>([])

	$effect(() => {
		if (!browser || frameworkHydrated) return
		frameworkHydrated = true
		const stored = localStorage.getItem('graph-framework')
		if (stored === 'sigma' || stored === 'g6') {
			graphFramework = stored
		}
	})

	$effect(() => {
		if (!browser || !frameworkHydrated) return
		localStorage.setItem('graph-framework', graphFramework)
	})

	const walletsQuery = useLiveQuery((q) =>
		q
			.from({ row: walletsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)
	const connectionsQuery = useLiveQuery((q) =>
		q
			.from({ row: walletConnectionsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)
	const actorsQuery = useLiveQuery((q) =>
		q
			.from({ row: actorsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)
	const coinsQuery = useLiveQuery((q) =>
		q
			.from({ row: actorCoinsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Voltaire))
			.select(({ row }) => ({ row })),
	)
	const allowancesQuery = useLiveQuery((q) =>
		q
			.from({ row: actorAllowancesCollection })
			.where(({ row }) => eq(row.$source, DataSource.Voltaire))
			.select(({ row }) => ({ row })),
	)
	const routesQuery = useLiveQuery((q) =>
		q
			.from({ row: bridgeRoutesCollection })
			.where(({ row }) => eq(row.$source, DataSource.LiFi))
			.select(({ row }) => ({ row })),
	)
	const txQuery = useLiveQuery((q) =>
		q
			.from({ row: transactionsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)

	// Types/constants
	type GraphSceneEntityType = (typeof GRAPH_SCENE_ENTITY_TYPES)[number]

	const collections: Record<
		GraphSceneEntityType,
		{ color: string; label: string; size: number; ring: number }
	> = {
		[EntityType.Wallet]: {
			color: '#3b82f6',
			label: 'Wallets',
			size: 18,
			ring: 0,
		},
		[EntityType.WalletConnection]: {
			color: '#22c55e',
			label: 'Sessions',
			size: 14,
			ring: 1,
		},
		[EntityType.Actor]: {
			color: '#f59e0b',
			label: 'Accounts',
			size: 16,
			ring: 2,
		},
		[EntityType.ActorCoin]: {
			color: '#8b5cf6',
			label: 'Balances',
			size: 10,
			ring: 3,
		},
		[EntityType.ActorAllowance]: {
			color: '#ec4899',
			label: 'Approvals',
			size: 9,
			ring: 3.5,
		},
		[EntityType.BridgeRoute]: {
			color: '#06b6d4',
			label: 'Routes',
			size: 12,
			ring: 4,
		},
		[EntityType.Transaction]: {
			color: '#ef4444',
			label: 'Transactions',
			size: 11,
			ring: 4.5,
		},
	}

	const edgeColors = {
		owns: '#64748b',
		connection: '#22c55e',
		balance: '#8b5cf6',
		allowance: '#ec4899',
		route: '#06b6d4',
		transaction: '#ef4444',
	}

	// (Derived)
	const counts: Record<string, number> = $derived({
		[EntityType.Wallet]: walletsQuery.data?.length ?? 0,
		[EntityType.WalletConnection]: connectionsQuery.data?.length ?? 0,
		[EntityType.Actor]: actorsQuery.data?.length ?? 0,
		[EntityType.ActorCoin]: coinsQuery.data?.length ?? 0,
		[EntityType.ActorAllowance]: allowancesQuery.data?.length ?? 0,
		[EntityType.BridgeRoute]: routesQuery.data?.length ?? 0,
		[EntityType.Transaction]: txQuery.data?.length ?? 0,
	})

	// Functions
	const isRecord = (value: unknown): value is Record<string, unknown> =>
		typeof value === 'object' && value !== null

	const getChainName = (chainId: number) =>
		networksByChainId[chainId]?.name ?? `Chain ${chainId}`

	// (Derived)
	const graphModel = $derived.by(() => {
		if (!browser) return null

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
			const wallets = walletsQuery.data ?? []
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
					details: { rdns: row.rdns },
				})
			})
		}

		// Add connection nodes
		if (visibleCollections.has(EntityType.WalletConnection)) {
			const connections = connectionsQuery.data ?? []
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
						})
					}
				}
			})
		}

		// Add actor nodes
		if (visibleCollections.has(EntityType.Actor)) {
			const actors = actorsQuery.data ?? []
			const connections = connectionsQuery.data ?? []
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
								})
							}
						}
					}
				}
			})
		}

		// Add coin balance nodes
		if (visibleCollections.has(EntityType.ActorCoin)) {
			const coins = coinsQuery.data ?? []
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
						})
					}
				}
			})
		}

		// Add allowance nodes
		if (visibleCollections.has(EntityType.ActorAllowance)) {
			const allowances = allowancesQuery.data ?? []
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
						})
					}
				}
			})
		}

		// Add route nodes
		if (visibleCollections.has(EntityType.BridgeRoute)) {
			const routes = routesQuery.data ?? []
			routes.forEach(({ row }, i) => {
				const routeId = `routes:${row.$id.fromChainId}:${row.$id.toChainId}:${row.$id.amount}`
				if (g.hasNode(routeId)) return
				const pos = positionInRing(
					collections[EntityType.BridgeRoute].ring,
					i,
					routes.length,
				)
				const hasRoutes = row.routes.length > 0
				const fromChain = getChainName(row.$id.fromChainId)
				const toChain = getChainName(row.$id.toChainId)
				addNode({
					id: routeId,
					label: hasRoutes
						? `${row.routes.length}× ${fromChain} → ${toChain}`
						: `${fromChain} → ${toChain}`,
					...pos,
					size: hasRoutes
						? collections[EntityType.BridgeRoute].size +
							Math.min(row.routes.length, 5)
						: collections[EntityType.BridgeRoute].size,
					color: hasRoutes
						? collections[EntityType.BridgeRoute].color
						: `${collections[EntityType.BridgeRoute].color}55`,
					type: 'circle',
					collection: EntityType.BridgeRoute,
					details: {
						from: fromChain,
						to: toChain,
						count: row.routes.length,
						loading: row.isLoading,
					},
				})
			})
		}

		// Add transaction nodes
		if (visibleCollections.has(EntityType.Transaction)) {
			const txs = txQuery.data ?? []
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
						})
					}
				}
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
				} else if ('fromChainId' in rowId && 'amount' in rowId) {
					const fromChainId = rowId.fromChainId
					const toChainId = rowId.toChainId
					const amount = rowId.amount
					if (
						typeof fromChainId === 'number' &&
						typeof toChainId === 'number' &&
						typeof amount === 'bigint'
					) {
						nodes.push(`routes:${fromChainId}:${toChainId}:${amount}`)
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
			coinsQuery.data?.length,
			allowancesQuery.data?.length,
			routesQuery.data?.length,
			txQuery.data?.length,
			[...visibleCollections].join(','),
		].join(':'),
	)
</script>

{#if visible && graphModel}
	<aside
		class="graph-scene"
		data-expanded={expanded}
	>
		<header class="graph-scene-header">
			<button
				class="graph-scene-collapse"
				type="button"
				onclick={() => {
					expanded = !expanded
				}}
			>
				{expanded ? '▼' : '▲'}
			</button>
			<h4>Data Graph</h4>
			<div class="graph-scene-framework">
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
			<div class="graph-scene-stats">
				{graphModel.graph.order} nodes · {graphModel.graph.size} edges
				{#if highlightedSet.size > 0}
					<span class="graph-scene-highlight">
						· {highlightedNodes.length} active
					</span>
				{/if}
			</div>
		</header>

		{#if expanded}
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
								{#each hoveredNodeEntries as [key, value]}
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
				<div class="graph-scene-legend">
					{#each Object.entries(collections) as [key, config]}
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
					<div class="graph-scene-selection">
						<h5>Selection</h5>
						<ul>
							{#each selectionItems as item}
								<li>
									<button
										type="button"
										data-kind={item.kind}
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
										<strong>{item.label}</strong>
										<span>{item.collection}</span>
									</button>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</footer>
		{/if}
	</aside>
{/if}

<style>
	.graph-scene {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		width: 440px;
		background: var(--color-bg-page, #fff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.75rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
		display: flex;
		flex-direction: column;
		z-index: 50;
		transition: height 0.2s ease;

		&[data-expanded='true'] {
			height: 380px;
		}

		&[data-expanded='false'] {
			height: auto;
		}
	}

	.graph-scene-header {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--color-border, #e5e7eb);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-bg-elevated, #fafafa);
		border-radius: 0.75rem 0.75rem 0 0;
	}

	.graph-scene-collapse {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.625rem;
		opacity: 0.5;
		padding: 0.25rem;
		line-height: 1;

		&:hover {
			opacity: 1;
		}
	}

	.graph-scene-header h4 {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		flex: 1;
	}

	.graph-scene-framework {
		display: flex;
		gap: 0.25rem;
	}

	.graph-scene-framework button {
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.5rem;
		background: white;
		font-size: 0.625rem;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		opacity: 0.6;
		transition: all 0.15s ease;

		&[data-active='true'] {
			opacity: 1;
			background: #0f172a;
			border-color: #0f172a;
			color: white;
		}

		&:hover {
			opacity: 1;
		}
	}

	.graph-scene-stats {
		font-size: 0.6875rem;
		opacity: 0.6;
		display: flex;
		gap: 0.25rem;
	}

	.graph-scene-highlight {
		color: #3b82f6;
		font-weight: 500;
	}

	.graph-scene-container {
		flex: 1;
		min-height: 0;
		position: relative;
		background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
	}

	.graph-scene-hover {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		background: rgba(255, 255, 255, 0.97);
		backdrop-filter: blur(12px);
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-width: 200px;
		pointer-events: none;
		border: 1px solid rgba(0, 0, 0, 0.06);
	}

	.graph-scene-hover-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.graph-scene-hover-header .graph-scene-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.graph-scene-hover strong {
		font-size: 0.75rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.graph-scene-hover .graph-scene-collection {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.5;
	}

	.graph-scene-details {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.125rem 0.5rem;
		font-size: 0.625rem;
		margin: 0.25rem 0 0;
		padding-top: 0.25rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}

	.graph-scene-details dt {
		opacity: 0.5;
		text-transform: capitalize;
	}

	.graph-scene-details dd {
		margin: 0;
		font-family: ui-monospace, monospace;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.graph-scene-footer {
		padding: 0.5rem 0.625rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
		background: var(--color-bg-elevated, #fafafa);
		border-radius: 0 0 0.75rem 0.75rem;
	}

	.graph-scene-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.graph-scene-legend button {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.625rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 1rem;
		background: white;
		cursor: pointer;
		transition: all 0.15s ease;
		opacity: 0.5;

		&[data-active='true'] {
			opacity: 1;
			background: color-mix(in srgb, var(--color) 8%, white);
			border-color: color-mix(in srgb, var(--color) 30%, transparent);
		}

		&:hover {
			opacity: 1;
			transform: scale(1.02);
		}
	}

	.graph-scene-legend .graph-scene-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color);
	}

	.graph-scene-legend .graph-scene-count {
		font-size: 0.5625rem;
		font-weight: 600;
		background: color-mix(in srgb, var(--color) 15%, white);
		color: var(--color);
		padding: 0.0625rem 0.25rem;
		border-radius: 0.75rem;
		min-width: 1rem;
		text-align: center;
	}

	.graph-scene-selection {
		margin-top: 0.5rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
		padding-top: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.graph-scene-selection h5 {
		margin: 0;
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.6;
	}

	.graph-scene-selection ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.graph-scene-selection button {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.5rem;
		background: white;
		padding: 0.25rem 0.5rem;
		font-size: 0.625rem;
		cursor: pointer;
		text-align: left;
	}

	.graph-scene-selection button strong {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.graph-scene-selection button span {
		opacity: 0.5;
		font-size: 0.5625rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}

	@media (prefers-color-scheme: dark) {
		.graph-scene-container {
			background: linear-gradient(
				145deg,
				#1e293b 0%,
				#0f172a 50%,
				#020617 100%
			);
		}

		.graph-scene-hover {
			background: rgba(30, 41, 59, 0.97);
			border-color: rgba(255, 255, 255, 0.06);
		}

		.graph-scene-details {
			border-top-color: rgba(255, 255, 255, 0.06);
		}

		.graph-scene-legend button {
			background: #1e293b;

			&[data-active='true'] {
				background: color-mix(in srgb, var(--color) 15%, #1e293b);
			}
		}

		.graph-scene-legend .graph-scene-count {
			background: color-mix(in srgb, var(--color) 20%, #1e293b);
		}

		.graph-scene-framework button {
			background: #0f172a;
			border-color: rgba(148, 163, 184, 0.3);
			color: #e2e8f0;

			&[data-active='true'] {
				background: #e2e8f0;
				border-color: #e2e8f0;
				color: #0f172a;
			}
		}

		.graph-scene-selection button {
			background: #0f172a;
			border-color: rgba(148, 163, 184, 0.3);
			color: #e2e8f0;
		}
	}
</style>
