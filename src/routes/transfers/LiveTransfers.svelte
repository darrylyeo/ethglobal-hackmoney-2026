<script lang="ts">
	// Types/constants
	import { browser } from '$app/environment'
	import type { Erc20Token } from '$/constants/coins'
	import type { TransferGraph } from '$/api/transfers-indexer'
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
	}: {
		coin: Erc20Token
		graph: TransferGraph
		period: string
		periods: readonly { value: string; label: string; ms: number }[]
	} = $props()

	// (Derived) layout: nodes in circle
	const radius = 8
	const nodePositionByAddress = $derived(
		(() => {
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
		})(),
	)
	const sortedEdges = $derived(
		[...graph.edges].sort(
			(a, b) => Math.min(...a.timestamps) - Math.min(...b.timestamps),
		),
	)
	const totalVolume = $derived(
		graph.edges.reduce((s, e) => s + e.totalAmount, 0),
	)

	// State: stagger edges by timestamp over 2s
	let visibleEdgeCount = $state(0)
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

	const visibleEdges = $derived(sortedEdges.slice(0, visibleEdgeCount))
	const edgeGeometry = $derived(
		(() => {
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
		})(),
	)
</script>


<div data-column="gap-4">
	<header data-row="wrap gap-4">
		<h2>Live transfers – {coin.symbol}</h2>
		<nav data-row="start gap-2" aria-label="Time period">
			{#each periods as p (p.value)}
				<a
					class="period-link"
					href="?period={p.value}"
					data-active={period === p.value ? '' : undefined}
				>
					{p.label}
				</a>
			{/each}
		</nav>
	</header>

	<div class="viz-container" data-card>
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

		&[data-active] {
			background: var(--accent-backgroundColor);
			color: var(--accent-color);
		}
	}

	.viz-container {
		width: 100%;
		height: 400px;
		overflow: hidden;

		:global(canvas) {
			display: block;
			width: 100%;
			height: 100%;
		}
	}

	.transfers-loading,
	.transfers-empty,
	.transfers-summary {
		font-size: 0.875em;
		opacity: 0.8;
	}
</style>
