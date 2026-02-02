<script lang="ts">
	// Types/constants
	import type { EdgeData, Graph as G6Graph, NodeData } from '@antv/g6'
	import type {
		ArchitectureEdge,
		ArchitectureGraphModel,
		ArchitectureNode,
	} from '$/lib/architecture-graph'

	// Functions
	import { Graph, EdgeEvent, NodeEvent } from '@antv/g6'
	import { getArchitectureGraphModel } from '$/lib/architecture-graph'

	// State
	let hoveredId = $state<string | null>(null)

	// (Derived)
	const model = $derived(getArchitectureGraphModel())
</script>

<div class="architecture-graph-wrap">
	<div
		role="application"
		tabindex="0"
		aria-label="Architecture diagram of app systems and data flows"
		class="graph-container"
		{@attach (container) => {
			let graph: G6Graph | undefined
			let resizeObserver: ResizeObserver | undefined
			const reducedMotion = window.matchMedia(
				'(prefers-reduced-motion: reduce)',
			).matches
			const prefersDark = window.matchMedia(
				'(prefers-color-scheme: dark)',
			).matches
			const labelBg = prefersDark
				? 'rgba(15, 23, 42, 0.9)'
				: 'rgba(255, 255, 255, 0.9)'
			const labelFg = prefersDark ? '#e2e8f0' : '#0f172a'
			const nodeFill = prefersDark ? '#334155' : '#cbd5e1'
			const nodeStroke = prefersDark ? '#475569' : '#94a3b8'
			const edgeStroke = prefersDark ? '#64748b' : '#94a3b8'
			const criticalStroke = prefersDark ? '#38bdf8' : '#0ea5e9'

			const getNodeType = (n: ArchitectureNode) =>
				n.image
					? 'image'
					: n.category === 'network'
						? 'circle'
						: n.category === 'ui' || n.category === 'state'
							? 'rect'
							: 'diamond'

			const getNodeData = (n: ArchitectureNode): NodeData => ({
				id: n.id,
				type: getNodeType(n),
				data: {
					label: n.label,
					category: n.category,
					details: n.details ?? {},
				},
				style: n.image
					? {
							x: n.x,
							y: n.y,
							size: 32,
							fill: nodeFill,
							stroke: nodeStroke,
							src: n.image,
							labelText: n.label,
							labelBackground: true,
							labelBackgroundFill: labelBg,
							labelBackgroundRadius: 6,
							labelPadding: [4, 8],
							labelFill: labelFg,
							labelFontSize: 10,
						}
					: {
							x: n.x,
							y: n.y,
							size: n.category === 'network' ? 24 : 28,
							fill: nodeFill,
							stroke: nodeStroke,
							labelText: n.label,
							labelBackground: true,
							labelBackgroundFill: labelBg,
							labelBackgroundRadius: 6,
							labelPadding: [4, 8],
							labelFill: labelFg,
							labelFontSize: 10,
						},
			})

			const getEdgeData = (e: ArchitectureEdge): EdgeData => ({
				id: e.id,
				source: e.source,
				target: e.target,
				type: 'line',
				data: { label: e.label, critical: e.critical },
				style: {
					stroke: e.critical ? criticalStroke : edgeStroke,
					lineWidth: e.critical ? 2 : 1,
					endArrow: true,
					labelText: e.label,
					labelBackground: true,
					labelBackgroundFill: labelBg,
					labelBackgroundRadius: 4,
					labelPadding: [2, 6],
					labelFill: labelFg,
					labelFontSize: 9,
				},
			})

			const buildData = () => ({
				nodes: model.nodes.map((n) => getNodeData(n)),
				edges: model.edges.map((e) => getEdgeData(e)),
			})

			const { width, height } = container.getBoundingClientRect()
			graph = new Graph({
				container,
				width,
				height,
				autoFit: 'center',
				data: buildData(),
				node: {
					state: {
						selected: {
							lineWidth: 2,
							halo: true,
							haloLineWidth: 6,
							haloStroke: '#60a5fa',
							haloStrokeOpacity: 0.35,
						},
						active: {
							lineWidth: 2,
							halo: true,
							haloLineWidth: 4,
							haloStroke: '#38bdf8',
							haloStrokeOpacity: 0.35,
						},
					},
					animation: reducedMotion
						? false
						: {
								update: [{ fields: ['x', 'y'], duration: 250 }],
							},
				},
				edge: {
					state: {
						selected: {
							lineWidth: 2,
							halo: true,
							haloLineWidth: 5,
							haloStroke: '#60a5fa',
							haloStrokeOpacity: 0.35,
						},
						active: {
							lineWidth: 2,
							halo: true,
							haloLineWidth: 4,
							haloStroke: '#38bdf8',
							haloStrokeOpacity: 0.35,
						},
					},
					animation: reducedMotion
						? false
						: {
								update: [{ fields: ['controlPoints'], duration: 250 }],
							},
				},
				behaviors: [
					{
						type: 'drag-canvas',
						range: 2,
						trigger: {
							up: ['ArrowUp'],
							down: ['ArrowDown'],
							left: ['ArrowLeft'],
							right: ['ArrowRight'],
						},
					},
					{
						type: 'zoom-canvas',
						animation: !reducedMotion,
						trigger: { zoomIn: ['+'], zoomOut: ['-'], reset: ['0'] },
					},
					{ type: 'drag-element' },
					{ type: 'click-select' },
					{ type: 'hover-activate' },
					{ type: 'focus-element' },
				],
				plugins: [
					{
						type: 'tooltip',
						getContent: (_event, items) => {
							const [item] = items ?? []
							if (!item) return ''
							const details = (item.data?.details ?? {}) as Record<
								string,
								string
							>
							const detailsMarkup = Object.entries(details)
								.filter(([_, v]) => v !== undefined && v !== null && v !== '')
								.map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`)
								.join('')
							return `<div><strong>${item.data?.label ?? item.id}</strong>${detailsMarkup ? `<div>${detailsMarkup}</div>` : ''}</div>`
						},
					},
				],
			})
			graph.render()

			graph.on(NodeEvent.POINTER_OVER, (event) => {
				const id = typeof event.target?.id === 'string' ? event.target.id : null
				hoveredId = id
			})
			graph.on(NodeEvent.POINTER_OUT, () => {
				hoveredId = null
			})
			graph.on(EdgeEvent.POINTER_OVER, (event) => {
				const id = typeof event.target?.id === 'string' ? event.target.id : null
				hoveredId = id
			})
			graph.on(EdgeEvent.POINTER_OUT, () => {
				hoveredId = null
			})

			const clearSelection = () => {
				if (!graph) return
				for (const n of model.nodes) {
					const states = graph
						.getElementState(n.id)
						.filter((s) => s !== 'selected')
					graph.setElementState(n.id, states)
				}
				for (const e of model.edges) {
					const states = graph
						.getElementState(e.id)
						.filter((s) => s !== 'selected')
					graph.setElementState(e.id, states)
				}
				hoveredId = null
			}
			const handleKeydown = (e: KeyboardEvent) => {
				if (e.key === 'Escape') clearSelection()
			}
			container.addEventListener('keydown', handleKeydown)

			resizeObserver = new ResizeObserver((entries) => {
				const entry = entries[0]
				if (!entry || !graph) return
				const w = Math.max(1, entry.contentRect.width)
				const h = Math.max(1, entry.contentRect.height)
				const resize = graph.resize
				if (typeof resize === 'function') resize.call(graph, w, h)
			})
			resizeObserver.observe(container)

			return () => {
				container.removeEventListener('keydown', handleKeydown)
				resizeObserver?.disconnect()
				graph?.destroy()
				graph = undefined
			}
		}}
	></div>
	{#if hoveredId}
		{@const hoveredNode = model.nodes.find((n) => n.id === hoveredId)}
		{@const hoveredEdge = model.edges.find((e) => e.id === hoveredId)}
		<div class="details-panel" role="status" aria-live="polite">
			{#if hoveredNode}
				<strong>{hoveredNode.label}</strong>
				{#if hoveredNode.details?.description}
					<p>{hoveredNode.details.description}</p>
				{/if}
			{:else if hoveredEdge}
				<strong>{hoveredEdge.source} → {hoveredEdge.target}</strong>
				<p>{hoveredEdge.label}</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.architecture-graph-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
		min-height: 400px;
	}
	.graph-container {
		flex: 1;
		min-height: 0;
		border-radius: 0.5rem;
		background: var(--color-surface, #f1f5f9);
		outline: 1px solid var(--color-border, #e2e8f0);
	}
	:global([data-theme='dark']) .graph-container,
	:global(.dark) .graph-container {
		--color-surface: #1e293b;
		--color-border: #334155;
	}
	@media (prefers-color-scheme: dark) {
		.graph-container {
			--color-surface: #1e293b;
			--color-border: #334155;
		}
	}
	.details-panel {
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		background: var(--color-surface, #f1f5f9);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.375rem;
	}
	.details-panel strong {
		display: block;
	}
	.details-panel p {
		margin: 0.25rem 0 0;
		color: var(--color-muted, #64748b);
	}
</style>
