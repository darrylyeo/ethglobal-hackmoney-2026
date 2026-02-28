<script lang="ts">
	// Types/constants
	import { browser } from '$app/environment'
	import type { CoinInstance } from '$/constants/coin-instances.ts'
	import type { TransferGraph } from '$/api/transfers-indexer.ts'
	import { arrowToPathD, computeArrow } from '$/lib/flow-arrow.ts'
	import { Canvas, T } from '@threlte/core'
	import * as THREE from 'three'

	function chainColor(chainId: number): number {
		const hue = (chainId * 137.508) % 360
		return new THREE.Color().setHSL(hue / 360, 0.7, 0.5).getHex()
	}


	// Props
	let {
		coin,
		graph,
		period,
		periods,
		showHeader = true,
	}: {
		coin: CoinInstance
		graph: TransferGraph
		period: string
		periods: readonly { value: string; label: string; ms: number }[]
		showHeader?: boolean
	} = $props()

	// (Derived) layout: nodes in circle
	const radius = 8
	const nodePositionByAddress = $derived.by(() => {
		const nodes = graph.nodes
		const nodeCount = nodes.length
		return new Map(
			nodes.map((n, i) => {
				const angle = (2 * Math.PI * i) / (nodeCount || 1)
				return [
					n.address,
					new THREE.Vector3(
						radius * Math.cos(angle),
						radius * Math.sin(angle),
						0,
					),
				]
			}),
		)
	})
	const sortedEdges = $derived(
		[...graph.edges].sort(
			(a, b) => Math.min(...a.timestamps) - Math.min(...b.timestamps),
		),
	)
	const totalVolume = $derived(
		graph.edges.reduce((s, e) => s + e.totalAmount, 0),
	)

	// State: stagger edges by timestamp over 2s
	let visibleEdgeCount = $state(
		0
	)
	$effect(() => {
		const edges = sortedEdges
		visibleEdgeCount = 0
		if (edges.length === 0) return
		const duration = 2000
		const step = 50
		const perStep = Math.max(1, Math.ceil(edges.length / (duration / step)))
		const id = setInterval(() => {
			visibleEdgeCount = Math.min(visibleEdgeCount + perStep, edges.length)
			if (visibleEdgeCount >= edges.length) clearInterval(id)
		}, step)
		return () => clearInterval(id)
	})

	let vizWidth = $state(
		400
	)
	let vizHeight = $state(
		400
	)

	const node2d = $derived(
		new Map(
			graph.nodes.map((n, i) => {
				const count = graph.nodes.length || 1
				const angle = (2 * Math.PI * i) / count
				const r = Math.min(vizWidth, vizHeight) * 0.35
				return [
					n.address,
					{
						x: vizWidth / 2 + r * Math.cos(angle),
						y: vizHeight / 2 + r * Math.sin(angle),
					},
				]
			}),
		),
	)

	const edgeArrowPaths = $derived(
		visibleEdgeCount > 0
			? sortedEdges.slice(0, visibleEdgeCount).flatMap((e) => {
					const from = node2d.get(e.fromAddress)
					const to = node2d.get(e.toAddress)
					if (!from || !to) return []
					const s = 6
					const sourceRect = { left: from.x - s, top: from.y - s, width: s * 2, height: s * 2 }
					const targetRect = { left: to.x - s, top: to.y - s, width: s * 2, height: s * 2 }
					return [arrowToPathD(computeArrow(sourceRect, targetRect, { padStart: 4, padEnd: 8 }))]
				})
			: [],
	)

	const visibleEdges = $derived(
		sortedEdges.slice(0, visibleEdgeCount)
	)
	const edgeGeometry = $derived.by(() => {
		const geom = new THREE.BufferGeometry()
		if (visibleEdges.length === 0) return geom
		const positions = new Float32Array(visibleEdges.length * 2 * 3)
		let idx = 0
		for (const e of visibleEdges) {
			const from = nodePositionByAddress.get(e.fromAddress)
			const to = nodePositionByAddress.get(e.toAddress)
			if (from && to) {
				positions[idx++] = from.x
				positions[idx++] = from.y
				positions[idx++] = from.z
				positions[idx++] = to.x
				positions[idx++] = to.y
				positions[idx++] = to.z
			}
		}
		geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
		geom.computeBoundingSphere()
		return geom
	})
</script>


<div class="live-transfers" data-column="gap-4">
	{#if showHeader}
		<header class="transfers-header" data-row="wrap gap-4">
			<h2>Live transfers – {coin.symbol}</h2>
			<nav class="period-selector" data-row aria-label="Time period">
				{#each periods as p (p.value)}
					<a
						class="period-link"
						href="?period={p.value}"
						class:active={period === p.value}
					>
						{p.label}
					</a>
				{/each}
			</nav>
		</header>
	{/if}

	<div class="viz-container" data-card bind:clientWidth={vizWidth} bind:clientHeight={vizHeight}>
		{#if browser}
			<Canvas aria-label="Transfer graph" role="img">
				<T.PerspectiveCamera makeDefault position={[0, 0, 20]} />
				<T.AmbientLight intensity={0.8} />
				<T.DirectionalLight position={[10, 10, 10]} intensity={1} />

				{#if graph.edges.length > 0}
					<T.LineSegments
						args={[
							edgeGeometry,
							new THREE.LineBasicMaterial({ color: 0x666666 }),
						]}
					/>
				{/if}

				{#each graph.nodes as node (node.address)}
					{@const pos = nodePositionByAddress.get(node.address)}
					{#if pos}
						<T.Mesh position={[pos.x, pos.y, pos.z]}>
							<T.SphereGeometry args={[0.15, 12, 12]} />
							<T.MeshBasicMaterial
								color={node.chainIds[0] != null
									? chainColor(node.chainIds[0])
									: 0x888888}
							/>
						</T.Mesh>
					{/if}
				{/each}
			</Canvas>
		{:else}
			<p class="transfers-loading">Loading visualization…</p>
		{/if}

		{#if edgeArrowPaths.length > 0}
			<svg class="edge-arrows-overlay" aria-hidden="true">
				<defs>
					<marker
						id="transfer-arrow-head"
						markerWidth="10"
						markerHeight="10"
						viewBox="0 0 12 12"
						refX="10"
						refY="6"
						orient="auto"
					>
						<path d="M 0 0 L 12 6 L 0 12 z" fill="var(--color-accent, light-dark(#2563eb, #60a5fa))" />
					</marker>
				</defs>
				{#each edgeArrowPaths as d (d)}
					<path
						{d}
						fill="none"
						stroke="var(--color-accent, light-dark(#2563eb, #60a5fa))"
						stroke-width="1.5"
						stroke-linecap="round"
						marker-end="url(#transfer-arrow-head)"
						vector-effect="non-scaling-stroke"
						opacity="0.6"
					/>
				{/each}
			</svg>
		{/if}
	</div>

	{#if graph.nodes.length === 0 && graph.edges.length === 0}
		<p class="transfers-empty">No transfer data for this period.</p>
	{:else}
		<p class="transfers-summary">
			{graph.nodes.length} actors, {graph.edges.length} flows
			{totalVolume > 0
				? ` · ${totalVolume.toLocaleString(undefined, {
						minimumFractionDigits: 0,
						maximumFractionDigits: 2,
					})} ${coin.symbol} total volume`
				: ''}
		</p>
	{/if}
</div>


<style>
	.period-link {
		padding: 0.25em 0.5em;
		border-radius: 0.25em;
		text-decoration: none;
		background: var(--color-bg-subtle);
		color: var(--color-text);

		&.active {
			background: var(--accent-backgroundColor);
			color: var(--accent-color);
		}
	}

	.viz-container {
		position: relative;
		width: 100%;
		height: 400px;
		overflow: hidden;

		:global(canvas) {
			display: block;
			width: 100%;
			height: 100%;
		}
	}

	.edge-arrows-overlay {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: visible;
	}

	.transfers-loading,
	.transfers-empty,
	.transfers-summary {
		font-size: 0.875em;
		opacity: 0.8;
	}
</style>
