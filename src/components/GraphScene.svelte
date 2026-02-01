<script lang="ts">
	// Types
	import type { Attributes } from 'graphology-types'
	import type { DisplayData } from 'sigma/types'

	// Context
	import { browser } from '$app/environment'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { useLiveQueryContext } from '$/svelte/live-query-context.svelte'

	// Collections
	import { walletsCollection } from '$/collections/wallets'
	import { walletConnectionsCollection } from '$/collections/wallet-connections'
	import { actorsCollection } from '$/collections/actors'
	import { actorCoinsCollection } from '$/collections/actor-coins'
	import { actorAllowancesCollection } from '$/collections/actor-allowances'
	import { bridgeRoutesCollection } from '$/collections/bridge-routes'
	import { transactionsCollection } from '$/collections/transactions'

	// Functions
	import Graph from 'graphology'
	import { networksByChainId } from '$/constants/networks'
	import { formatSmallestToDecimal } from '$/lib/format'

	// Components
	import SigmaGraph from './SigmaGraph.svelte'


	// Props
	let {
		visible = false,
	}: {
		visible?: boolean
	} = $props()


	// Context
	const liveQueryCtx = useLiveQueryContext()


	// State
	let hoveredNode: string | undefined =
		$state(undefined)
	let expanded =
		$state(true)
	let visibleCollections: Set<string> =
		$state(new Set(['wallets', 'connections', 'actors', 'coins', 'allowances', 'routes', 'transactions']))


	// Queries for all collections
	const walletsQuery = useLiveQuery((q) => q.from({ row: walletsCollection }).select(({ row }) => ({ row })))
	const connectionsQuery = useLiveQuery((q) => q.from({ row: walletConnectionsCollection }).select(({ row }) => ({ row })))
	const actorsQuery = useLiveQuery((q) => q.from({ row: actorsCollection }).select(({ row }) => ({ row })))
	const coinsQuery = useLiveQuery((q) => q.from({ row: actorCoinsCollection }).select(({ row }) => ({ row })))
	const allowancesQuery = useLiveQuery((q) => q.from({ row: actorAllowancesCollection }).select(({ row }) => ({ row })))
	const routesQuery = useLiveQuery((q) => q.from({ row: bridgeRoutesCollection }).select(({ row }) => ({ row })))
	const txQuery = useLiveQuery((q) => q.from({ row: transactionsCollection }).select(({ row }) => ({ row })))


	// Collection config
	const collections = {
		wallets: { color: '#3b82f6', label: 'Wallets', size: 18, ring: 0 },
		connections: { color: '#22c55e', label: 'Sessions', size: 14, ring: 1 },
		actors: { color: '#f59e0b', label: 'Accounts', size: 16, ring: 2 },
		coins: { color: '#8b5cf6', label: 'Balances', size: 10, ring: 3 },
		allowances: { color: '#ec4899', label: 'Approvals', size: 9, ring: 3.5 },
		routes: { color: '#06b6d4', label: 'Routes', size: 12, ring: 4 },
		transactions: { color: '#ef4444', label: 'Transactions', size: 11, ring: 4.5 },
	} as const

	// Edge colors
	const edgeColors = {
		owns: '#64748b',
		connection: '#22c55e',
		balance: '#8b5cf6',
		allowance: '#ec4899',
		route: '#06b6d4',
		transaction: '#ef4444',
	}

	// Counts
	const counts = $derived({
		wallets: walletsQuery.data?.length ?? 0,
		connections: connectionsQuery.data?.length ?? 0,
		actors: actorsQuery.data?.length ?? 0,
		coins: coinsQuery.data?.length ?? 0,
		allowances: allowancesQuery.data?.length ?? 0,
		routes: routesQuery.data?.length ?? 0,
		transactions: txQuery.data?.length ?? 0,
	})

	// Helper to get chain name
	const getChainName = (chainId: number) => (
		networksByChainId[chainId]?.name ?? `Chain ${chainId}`
	)


	// Build graph from all collections
	const graph = $derived.by(() => {
		if (!browser) return null

		const g = new Graph({ multi: true, allowSelfLoops: true })

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
		if (visibleCollections.has('wallets')) {
			const wallets = walletsQuery.data ?? []
			wallets.forEach(({ row }, i) => {
				const rdns = row.$id?.rdns
				if (!rdns) return
				const pos = positionInRing(collections.wallets.ring, i, wallets.length)
				g.addNode(`wallet:${rdns}`, {
					label: row.name,
					...pos,
					size: collections.wallets.size,
					color: collections.wallets.color,
					type: row.icon ? 'image' : 'circle',
					image: row.icon || undefined,
					collection: 'wallets',
					details: { rdns: row.rdns },
				})
			})
		}

		// Add connection nodes
		if (visibleCollections.has('connections')) {
			const connections = connectionsQuery.data ?? []
			connections.forEach(({ row }, i) => {
				const rdns = row.$id?.wallet$id?.rdns
				if (!rdns) return
				const connId = `connection:${rdns}`
				if (g.hasNode(connId)) return
				const pos = positionInRing(collections.connections.ring, i, connections.length)
				const statusColor = row.status === 'connected' ? '#22c55e' : row.status === 'error' ? '#ef4444' : '#f59e0b'
				const chainName = row.chainId ? getChainName(row.chainId) : null
				g.addNode(connId, {
					label: row.status === 'connected'
						? `${row.actors.length} acct${row.actors.length !== 1 ? 's' : ''}${chainName ? ` · ${chainName}` : ''}`
						: row.status,
					...pos,
					size: collections.connections.size,
					color: statusColor,
					type: 'circle',
					collection: 'connections',
					details: { status: row.status, chainId: row.chainId, actors: row.actors.length },
				})
				if (visibleCollections.has('wallets')) {
					const walletId = `wallet:${rdns}`
					if (g.hasNode(walletId)) {
						g.addEdge(walletId, connId, {
							size: 2,
							color: edgeColors.connection,
							type: 'curvedArrow',
						})
					}
				}
			})
		}

		// Add actor nodes
		if (visibleCollections.has('actors')) {
			const actors = actorsQuery.data ?? []
			const connections = connectionsQuery.data ?? []
			actors.forEach(({ row }, i) => {
				const actorId = `actor:${row.$id.network}:${row.address}`
				if (g.hasNode(actorId)) return
				const pos = positionInRing(collections.actors.ring, i, actors.length)
				const chainName = getChainName(row.$id.network)
				g.addNode(actorId, {
					label: `${row.address.slice(0, 6)}…${row.address.slice(-4)}`,
					...pos,
					size: collections.actors.size,
					color: collections.actors.color,
					type: 'circle',
					collection: 'actors',
					details: { address: row.address, chain: chainName, chainId: row.$id.network },
				})
				// Connect actor to connection
				if (visibleCollections.has('connections')) {
					for (const { row: conn } of connections) {
						if (conn.actors.includes(row.address)) {
							const connRdns = conn.$id?.wallet$id?.rdns
							if (connRdns && g.hasNode(`connection:${connRdns}`)) {
								g.addEdge(`connection:${connRdns}`, actorId, {
									size: 1.5,
									color: edgeColors.owns,
									type: 'curvedArrow',
								})
							}
						}
					}
				}
			})
		}

		// Add coin balance nodes
		if (visibleCollections.has('coins')) {
			const coins = coinsQuery.data ?? []
			coins.forEach(({ row }, i) => {
				const coinId = `coin:${row.$id.chainId}:${row.$id.address}:${row.$id.tokenAddress}`
				if (g.hasNode(coinId)) return
				const pos = positionInRing(collections.coins.ring, i, coins.length)
				const hasBalance = row.balance > 0n
				const chainName = getChainName(row.$id.chainId)
				const balanceStr = hasBalance ? formatSmallestToDecimal(row.balance, row.decimals, 2) : '0'
				g.addNode(coinId, {
					label: `${balanceStr} ${row.symbol}`,
					...pos,
					size: hasBalance ? collections.coins.size + 3 : collections.coins.size,
					color: hasBalance ? collections.coins.color : `${collections.coins.color}55`,
					type: 'circle',
					collection: 'coins',
					details: { symbol: row.symbol, balance: balanceStr, chain: chainName, hasBalance },
				})
				if (visibleCollections.has('actors')) {
					const actorId = `actor:${row.$id.chainId}:${row.$id.address}`
					if (g.hasNode(actorId)) {
						g.addEdge(actorId, coinId, {
							size: hasBalance ? 1.5 : 0.5,
							color: hasBalance ? edgeColors.balance : `${edgeColors.balance}33`,
							type: 'curvedArrow',
						})
					}
				}
			})
		}

		// Add allowance nodes
		if (visibleCollections.has('allowances')) {
			const allowances = allowancesQuery.data ?? []
			allowances.forEach(({ row }, i) => {
				const allowanceId = `allowance:${row.$id.chainId}:${row.$id.address}:${row.$id.tokenAddress}:${row.$id.spenderAddress}`
				if (g.hasNode(allowanceId)) return
				const pos = positionInRing(collections.allowances.ring, i, allowances.length)
				const hasAllowance = row.allowance > 0n
				const chainName = getChainName(row.$id.chainId)
				g.addNode(allowanceId, {
					label: hasAllowance ? '✓ Approved' : '○ Pending',
					...pos,
					size: hasAllowance ? collections.allowances.size + 2 : collections.allowances.size,
					color: hasAllowance ? collections.allowances.color : `${collections.allowances.color}55`,
					type: 'circle',
					collection: 'allowances',
					details: { chain: chainName, approved: hasAllowance, spender: row.$id.spenderAddress.slice(0, 10) + '…' },
				})
				if (visibleCollections.has('coins')) {
					const coinId = `coin:${row.$id.chainId}:${row.$id.address}:${row.$id.tokenAddress}`
					if (g.hasNode(coinId)) {
						g.addEdge(coinId, allowanceId, {
							size: hasAllowance ? 1 : 0.5,
							color: hasAllowance ? edgeColors.allowance : `${edgeColors.allowance}33`,
							type: 'curvedArrow',
						})
					}
				}
			})
		}

		// Add route nodes
		if (visibleCollections.has('routes')) {
			const routes = routesQuery.data ?? []
			routes.forEach(({ row }, i) => {
				const routeId = `routes:${row.$id.fromChainId}:${row.$id.toChainId}:${row.$id.amount}`
				if (g.hasNode(routeId)) return
				const pos = positionInRing(collections.routes.ring, i, routes.length)
				const hasRoutes = row.routes.length > 0
				const fromChain = getChainName(row.$id.fromChainId)
				const toChain = getChainName(row.$id.toChainId)
				g.addNode(routeId, {
					label: hasRoutes ? `${row.routes.length}× ${fromChain} → ${toChain}` : `${fromChain} → ${toChain}`,
					...pos,
					size: hasRoutes ? collections.routes.size + Math.min(row.routes.length, 5) : collections.routes.size,
					color: hasRoutes ? collections.routes.color : `${collections.routes.color}55`,
					type: 'circle',
					collection: 'routes',
					details: { from: fromChain, to: toChain, count: row.routes.length, loading: row.isLoading },
				})
			})
		}

		// Add transaction nodes
		if (visibleCollections.has('transactions')) {
			const txs = txQuery.data ?? []
			txs.forEach(({ row }, i) => {
				const txId = `tx:${row.$id.sourceTxHash}`
				if (g.hasNode(txId)) return
				const pos = positionInRing(collections.transactions.ring, i, txs.length)
				const statusColors = { pending: '#f59e0b', completed: '#22c55e', failed: '#ef4444' }
				const statusIcon = { pending: '⏳', completed: '✓', failed: '✗' }
				const fromChain = getChainName(row.fromChainId)
				const toChain = getChainName(row.toChainId)
				g.addNode(txId, {
					label: `${statusIcon[row.status]} ${fromChain} → ${toChain}`,
					...pos,
					size: collections.transactions.size,
					color: statusColors[row.status] ?? collections.transactions.color,
					type: 'circle',
					collection: 'transactions',
					details: { status: row.status, from: fromChain, to: toChain, hash: row.$id.sourceTxHash.slice(0, 10) + '…' },
				})
				if (visibleCollections.has('actors')) {
					const actorId = `actor:${row.fromChainId}:${row.$id.address}`
					if (g.hasNode(actorId)) {
						g.addEdge(actorId, txId, {
							size: 1.5,
							color: edgeColors.transaction,
							type: 'curvedArrow',
						})
					}
				}
			})
		}

		return g
	})


	// Get highlighted nodes from current live query stack
	const highlightedNodes = $derived.by(() => {
		const nodes: string[] = []
		for (const entry of liveQueryCtx.stack) {
			for (const item of entry.query.data ?? []) {
				const row = (item as { row: { $id: unknown; [k: string]: unknown } }).row
				if (!row?.$id) continue
				const rowId = row.$id as Record<string, unknown>

				if ('rdns' in rowId && !('wallet$id' in rowId)) {
					const rdns = (rowId as { rdns: string }).rdns
					if (rdns) nodes.push(`wallet:${rdns}`)
				} else if ('wallet$id' in rowId) {
					const rdns = (rowId as { wallet$id: { rdns: string } }).wallet$id?.rdns
					if (rdns) nodes.push(`connection:${rdns}`)
				} else if ('network' in rowId && 'address' in rowId) {
					const id = rowId as { network: number; address: string }
					nodes.push(`actor:${id.network}:${id.address}`)
				} else if ('chainId' in rowId && 'tokenAddress' in rowId) {
					const id = rowId as { chainId: number; address: string; tokenAddress: string; spenderAddress?: string }
					if ('spenderAddress' in id) {
						nodes.push(`allowance:${id.chainId}:${id.address}:${id.tokenAddress}:${id.spenderAddress}`)
					} else {
						nodes.push(`coin:${id.chainId}:${id.address}:${id.tokenAddress}`)
					}
				} else if ('fromChainId' in rowId && 'amount' in rowId) {
					const id = rowId as { fromChainId: number; toChainId: number; amount: bigint }
					nodes.push(`routes:${id.fromChainId}:${id.toChainId}:${id.amount}`)
				} else if ('sourceTxHash' in rowId) {
					const id = rowId as { sourceTxHash: string }
					nodes.push(`tx:${id.sourceTxHash}`)
				}
			}
		}
		return nodes
	})

	const highlightedSet = $derived(new Set(highlightedNodes))


	// Node/edge reducers for highlighting
	const nodeReducer = (node: string, data: Attributes): Partial<DisplayData> => {
		const isHighlighted = highlightedSet.has(node)
		const isHovered = hoveredNode === node
		const color = (data.color ?? '#888888') as string
		const size = (data.size ?? 5) as number
		return {
			...data,
			color: isHighlighted || isHovered ? color : `${color}25`,
			size: isHovered ? size * 1.8 : isHighlighted ? size * 1.2 : size * 0.7,
			zIndex: isHovered ? 2 : isHighlighted ? 1 : 0,
		}
	}

	const edgeReducer = (edge: string, data: Attributes): Partial<DisplayData> => {
		const source = graph?.source(edge)
		const target = graph?.target(edge)
		const isHighlighted = (source && highlightedSet.has(source)) || (target && highlightedSet.has(target))
		const isHovered = (source && hoveredNode === source) || (target && hoveredNode === target)
		const color = (data.color ?? '#888888') as string
		const size = (data.size ?? 1) as number
		return {
			...data,
			color: isHighlighted || isHovered ? color : `${color}10`,
			size: isHovered ? size * 2 : isHighlighted ? size * 1.5 : size * 0.4,
		}
	}


	// Hover info
	const hoveredNodeData = $derived(
		hoveredNode && graph
			? graph.getNodeAttributes(hoveredNode)
			: null
	)


	// Toggle collection visibility
	const toggleCollection = (key: string) => {
		const next = new Set(visibleCollections)
		if (next.has(key)) next.delete(key)
		else next.add(key)
		visibleCollections = next
	}


	// Refresh key
	const refreshKey = $derived([
		walletsQuery.data?.length,
		connectionsQuery.data?.length,
		actorsQuery.data?.length,
		coinsQuery.data?.length,
		allowancesQuery.data?.length,
		routesQuery.data?.length,
		txQuery.data?.length,
		[...visibleCollections].join(','),
	].join(':'))
</script>


{#if visible && graph}
	<aside data-graph-scene data-expanded={expanded}>
		<header>
			<button type="button" onclick={() => { expanded = !expanded }} data-collapse>
				{expanded ? '▼' : '▲'}
			</button>
			<h4>Data Graph</h4>
			<div data-stats>
				{graph.order} nodes · {graph.size} edges
				{#if highlightedSet.size > 0}
					<span data-highlight>· {highlightedNodes.length} active</span>
				{/if}
			</div>
		</header>

		{#if expanded}
			<div data-graph-container>
				<SigmaGraph
					{graph}
					{refreshKey}
					{highlightedNodes}
					nodeReducer={nodeReducer}
					edgeReducer={edgeReducer}
					onNodeEnter={(node) => { hoveredNode = node }}
					onNodeLeave={() => { hoveredNode = undefined }}
				/>

				{#if hoveredNodeData}
					<div data-hover-info>
						<div data-hover-header>
							<span data-dot style="background: {hoveredNodeData.color}"></span>
							<strong>{hoveredNodeData.label}</strong>
						</div>
						<small data-collection>{hoveredNodeData.collection}</small>
						{#if hoveredNodeData.details}
							<dl data-details>
								{#each Object.entries(hoveredNodeData.details as Record<string, unknown>) as [key, value]}
									{#if value !== undefined && value !== null && value !== ''}
										<dt>{key}</dt>
										<dd>{value}</dd>
									{/if}
								{/each}
							</dl>
						{/if}
					</div>
				{/if}
			</div>

			<footer>
				<div data-legend>
					{#each Object.entries(collections) as [key, config]}
						{@const count = counts[key as keyof typeof counts]}
						<button
							type="button"
							style="--color: {config.color}"
							data-active={visibleCollections.has(key)}
							onclick={() => toggleCollection(key)}
						>
							<span data-dot></span>
							{config.label}
							{#if count > 0}<span data-count>{count}</span>{/if}
						</button>
					{/each}
				</div>
			</footer>
		{/if}
	</aside>
{/if}


<style>
	[data-graph-scene] {
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
	}

	[data-graph-scene][data-expanded="true"] {
		height: 380px;
	}

	[data-graph-scene][data-expanded="false"] {
		height: auto;
	}

	header {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--color-border, #e5e7eb);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-bg-elevated, #fafafa);
		border-radius: 0.75rem 0.75rem 0 0;
	}

	[data-collapse] {
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

	header h4 {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		flex: 1;
	}

	[data-stats] {
		font-size: 0.6875rem;
		opacity: 0.6;
		display: flex;
		gap: 0.25rem;
	}

	[data-highlight] {
		color: #3b82f6;
		font-weight: 500;
	}

	[data-graph-container] {
		flex: 1;
		min-height: 0;
		position: relative;
		background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
	}

	[data-hover-info] {
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

	[data-hover-header] {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	[data-hover-header] [data-dot] {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	[data-hover-info] strong {
		font-size: 0.75rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	[data-hover-info] [data-collection] {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.5;
	}

	[data-details] {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.125rem 0.5rem;
		font-size: 0.625rem;
		margin: 0.25rem 0 0;
		padding-top: 0.25rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}

	[data-details] dt {
		opacity: 0.5;
		text-transform: capitalize;
	}

	[data-details] dd {
		margin: 0;
		font-family: ui-monospace, monospace;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	footer {
		padding: 0.5rem 0.625rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
		background: var(--color-bg-elevated, #fafafa);
		border-radius: 0 0 0.75rem 0.75rem;
	}

	[data-legend] {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	[data-legend] button {
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

		&[data-active="true"] {
			opacity: 1;
			background: color-mix(in srgb, var(--color) 8%, white);
			border-color: color-mix(in srgb, var(--color) 30%, transparent);
		}

		&:hover {
			opacity: 1;
			transform: scale(1.02);
		}
	}

	[data-legend] [data-dot] {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color);
	}

	[data-legend] [data-count] {
		font-size: 0.5625rem;
		font-weight: 600;
		background: color-mix(in srgb, var(--color) 15%, white);
		color: var(--color);
		padding: 0.0625rem 0.25rem;
		border-radius: 0.75rem;
		min-width: 1rem;
		text-align: center;
	}

	@media (prefers-color-scheme: dark) {
		[data-graph-container] {
			background: linear-gradient(145deg, #1e293b 0%, #0f172a 50%, #020617 100%);
		}

		[data-hover-info] {
			background: rgba(30, 41, 59, 0.97);
			border-color: rgba(255, 255, 255, 0.06);
		}

		[data-details] {
			border-top-color: rgba(255, 255, 255, 0.06);
		}

		[data-legend] button {
			background: #1e293b;

			&[data-active="true"] {
				background: color-mix(in srgb, var(--color) 15%, #1e293b);
			}
		}

		[data-legend] [data-count] {
			background: color-mix(in srgb, var(--color) 20%, #1e293b);
		}
	}
</style>
