<script lang="ts">
	// Types/constants
	import type { EdgeData, Graph as G6Graph, NodeData } from '@antv/g6'
	import type {
		ArchitectureEdge,
		ArchitectureNode,
		ArchitectureNodeCategory,
	} from './architecture-graph'

	type TooltipItem = {
		id: string
		data?: {
			label?: string
			details?: Record<string, string>
		}
	}

	// Functions
	import { Graph, EdgeEvent, NodeEvent } from '@antv/g6'
	import { ConcentricLayout, ForceLayout } from '@antv/layout'
	import { getArchitectureGraphModel } from './architecture-graph'

	const getEventTargetId = (event: unknown): string | null => {
		if (typeof event !== 'object' || event == null) return null
		if (!('target' in event)) return null
		const target = event.target
		if (typeof target !== 'object' || target == null) return null
		if (!('id' in target)) return null
		const id = target.id
		return typeof id === 'string' ? id : null
	}

	// State
	let hoveredId = $state<string | null>(null)

	// (Derived)
	const model = $derived(getArchitectureGraphModel())
</script>

<div class="architecture-graph-wrap">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
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
			const categoryStyles: Record<
				ArchitectureNodeCategory,
				{ fill: string; stroke: string }
			> = prefersDark
				? {
						ui: { fill: '#1e3a8a', stroke: '#2563eb' },
						state: { fill: '#0f766e', stroke: '#14b8a6' },
						collection: { fill: '#6b21a8', stroke: '#a855f7' },
						storage: { fill: '#92400e', stroke: '#f59e0b' },
						service: { fill: '#1f2937', stroke: '#4b5563' },
						external: { fill: '#7c2d12', stroke: '#fb923c' },
						network: { fill: '#0f172a', stroke: '#38bdf8' },
						tooling: { fill: '#4c1d95', stroke: '#a78bfa' },
					}
				: {
						ui: { fill: '#dbeafe', stroke: '#93c5fd' },
						state: { fill: '#ccfbf1', stroke: '#5eead4' },
						collection: { fill: '#f3e8ff', stroke: '#d8b4fe' },
						storage: { fill: '#fef3c7', stroke: '#fbbf24' },
						service: { fill: '#e2e8f0', stroke: '#94a3b8' },
						external: { fill: '#ffedd5', stroke: '#fdba74' },
						network: { fill: '#e0f2fe', stroke: '#38bdf8' },
						tooling: { fill: '#ede9fe', stroke: '#c4b5fd' },
					}

			const getNodeType = (n: ArchitectureNode) =>
				n.image
					? 'image'
					: n.category === 'network'
						? 'circle'
						: n.category === 'ui' ||
							  n.category === 'state' ||
							  n.category === 'collection' ||
							  n.category === 'storage' ||
							  n.category === 'tooling'
							? 'rect'
							: 'diamond'
			const getCategoryStyle = (category: ArchitectureNodeCategory) =>
				categoryStyles[category] ?? { fill: nodeFill, stroke: nodeStroke }
			const getNumericSize = (value: unknown): number | undefined =>
				typeof value === 'number'
					? value
					: Array.isArray(value) && typeof value[0] === 'number'
						? value[0]
						: undefined
			const getStyleSize = (node: NodeData | undefined): unknown =>
				typeof node === 'object' &&
				node != null &&
				'style' in node &&
				typeof node.style === 'object' &&
				node.style != null &&
				'size' in node.style
					? node.style.size
					: undefined
			const getLayoutSize = (node: NodeData | undefined): number =>
				getNumericSize(getStyleSize(node)) ?? 28

			const areaByNodeId = new Map<string, string>([
				...[
					'dashboard-ui',
					'graphscene-ui',
					'client-ui',
					'transfers-ui',
					'visualization',
					'transaction-flow',
					'flow-orchestration',
					'rooms-ui',
					'test-ui',
				].map((id) => [id, 'client'] as const),
				...[
					'wallet-state',
					'flow-settings',
					'room-state',
					'yellow-state',
					'intent-preview-state',
					'data-sources',
					'configs',
					'tanstack-db',
					'tx-sessions',
				].map((id) => [id, 'state'] as const),
				...[
					'collections',
					'graph-model',
					'local-storage',
					'session-storage',
					'tx-history',
				].map((id) => [id, 'data'] as const),
				...[
					'wallets',
					'dashboard-core',
					'graphscene-core',
					'voltaire',
					'transfers',
					'lifi',
					'circle',
					'tx-status',
					'uniswap',
					'partykit',
					'siwe',
					'stork',
					'yellow',
					'nitro-rpc',
					'intents',
					'tevm-sim',
					'explain',
					'errors-retry',
					'toast',
					'approvals',
				].map((id) => [id, 'services'] as const),
				...[
					'wallet-providers',
					'rpc-providers',
					'lifi-api',
					'circle-api',
					'uniswap-router',
					'covalent-api',
					'partykit-server',
					'stork-feeds',
					'yellow-clearnode',
					'yellow-custody',
					'prompt-api',
					'hosted-llm',
					'chain-explorers',
					'tooling-tevm',
				].map((id) => [id, 'infra'] as const),
				...model.nodes
					.filter((n) => n.category === 'network')
					.map((n) => [n.id, 'networks'] as const),
				...model.nodes
					.filter((n) => n.category === 'tooling')
					.map((n) => [n.id, 'tooling'] as const),
			])

			const getNodeData = (n: ArchitectureNode): NodeData => ({
				id: n.id,
				combo: areaByNodeId.get(n.id)
					? `combo-${areaByNodeId.get(n.id)}`
					: undefined,
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
							fill: getCategoryStyle(n.category).fill,
							stroke: getCategoryStyle(n.category).stroke,
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
							fill: getCategoryStyle(n.category).fill,
							stroke: getCategoryStyle(n.category).stroke,
							labelText: n.label,
							labelBackground: true,
							labelBackgroundFill: labelBg,
							labelBackgroundRadius: 6,
							labelPadding: [4, 8],
							labelFill: labelFg,
							labelFontSize: 10,
						},
			})

			const nodeCategoryById = new Map(
				model.nodes.map((n) => [n.id, n.category]),
			)
			const getEdgeKind = (e: ArchitectureEdge) => {
				const sourceCategory = nodeCategoryById.get(e.source)
				const targetCategory = nodeCategoryById.get(e.target)
				if (sourceCategory === 'tooling' || targetCategory === 'tooling')
					return 'tooling'
				if (sourceCategory === 'external' || targetCategory === 'external')
					return 'external'
				if (sourceCategory === 'network' || targetCategory === 'network')
					return 'network'
				return 'runtime'
			}

			const getEdgeData = (e: ArchitectureEdge): EdgeData => ({
				id: e.id,
				source: e.source,
				target: e.target,
				type: getEdgeKind(e) === 'runtime' ? 'line' : 'cubic-horizontal',
				data: { label: e.label, critical: e.critical, kind: getEdgeKind(e) },
				style: {
					stroke: e.critical ? criticalStroke : edgeStroke,
					lineWidth: e.critical ? 2 : 1,
					lineDash: getEdgeKind(e) === 'tooling' ? [6, 4] : undefined,
					opacity: getEdgeKind(e) === 'external' ? 0.8 : 1,
					endArrow: true,
					endArrowType: e.critical ? 'triangle' : 'vee',
					endArrowSize: e.critical ? 10 : 8,
					labelText: e.label,
					labelAutoRotate: true,
					labelPlacement: 'center',
					labelMaxWidth: 140,
					labelWordWrap: true,
					labelBackground: true,
					labelBackgroundFill: labelBg,
					labelBackgroundRadius: 4,
					labelPadding: [2, 6],
					labelFill: labelFg,
					labelFontSize: 9,
					zIndex: e.critical ? 2 : 1,
					halo: e.critical,
					haloLineWidth: e.critical ? 4 : undefined,
					haloStroke: e.critical ? criticalStroke : undefined,
					haloStrokeOpacity: e.critical ? 0.25 : undefined,
				},
			})

			const comboPadding = 28
			const comboDefinitions = [
				{
					id: 'combo-client',
					label: 'Client & UI',
					fill: categoryStyles.ui.fill,
					stroke: categoryStyles.ui.stroke,
				},
				{
					id: 'combo-state',
					label: 'State & Config',
					fill: categoryStyles.state.fill,
					stroke: categoryStyles.state.stroke,
				},
				{
					id: 'combo-data',
					label: 'Data & Storage',
					fill: categoryStyles.collection.fill,
					stroke: categoryStyles.collection.stroke,
				},
				{
					id: 'combo-services',
					label: 'App Services',
					fill: categoryStyles.service.fill,
					stroke: categoryStyles.service.stroke,
				},
				{
					id: 'combo-infra',
					label: 'External & APIs',
					fill: categoryStyles.external.fill,
					stroke: categoryStyles.external.stroke,
				},
				{
					id: 'combo-networks',
					label: 'Networks',
					fill: categoryStyles.network.fill,
					stroke: categoryStyles.network.stroke,
				},
				{
					id: 'combo-tooling',
					label: 'Dev & QA',
					fill: categoryStyles.tooling.fill,
					stroke: categoryStyles.tooling.stroke,
				},
			]
			const comboLabelPlacement: 'top' = 'top'

			const buildData = () => ({
				nodes: model.nodes.map((n) => getNodeData(n)),
				edges: model.edges.map((e) => getEdgeData(e)),
				combos: comboDefinitions.map((combo) => ({
					id: combo.id,
					type: 'rect',
					data: { label: combo.label },
					style: {
						padding: comboPadding,
						fill: combo.fill,
						fillOpacity: prefersDark ? 0.08 : 0.2,
						stroke: combo.stroke,
						lineWidth: 1,
						lineDash: combo.id === 'combo-tooling' ? [6, 4] : undefined,
						labelText: combo.label,
						labelPlacement: comboLabelPlacement,
						labelBackground: true,
						labelBackgroundFill: labelBg,
						labelBackgroundRadius: 6,
						labelPadding: [2, 6],
						labelFill: labelFg,
						labelFontSize: 11,
						zIndex: 0,
					},
				})),
			})

			const { width, height } = container.getBoundingClientRect()
			graph = new Graph({
				container,
				width,
				height,
				autoFit: 'center',
				data: buildData(),
				layout: {
					type: 'combo-combined',
					animation: !reducedMotion,
					comboPadding,
					spacing: 24,
					nodeSize: getLayoutSize,
					innerLayout: new ConcentricLayout({
						nodeSize: getLayoutSize,
					}),
					outerLayout: new ForceLayout({
						preventOverlap: true,
						nodeSpacing: 16,
						nodeSize: getLayoutSize,
						linkDistance: 180,
						nodeStrength: -120,
						edgeStrength: 0.15,
						gravity: 0.15,
						damping: 0.9,
					}),
				},
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
					{ type: 'drag-canvas' },
					{
						type: 'zoom-canvas',
						animation: !reducedMotion,
					},
					{ type: 'drag-element', dropEffect: 'link' },
					{ type: 'click-select' },
					{ type: 'collapse-expand' },
					{ type: 'hover-activate' },
					{ type: 'focus-element' },
				],
				plugins: [
					{
						type: 'tooltip',
						getContent: (_event: unknown, items?: TooltipItem[]) => {
							const [item] = items ?? []
							if (!item) return ''
							const details = item.data?.details
							const detailsMarkup = Object.entries(details ?? {})
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
				hoveredId = getEventTargetId(event)
			})
			graph.on(NodeEvent.POINTER_OUT, () => {
				hoveredId = null
			})
			graph.on(EdgeEvent.POINTER_OVER, (event) => {
				hoveredId = getEventTargetId(event)
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
				if (!graph) return
				if (e.key === 'Escape') {
					clearSelection()
					return
				}
				if (e.key === '+' || e.key === '=') {
					e.preventDefault()
					graph.zoomBy(1.1, { duration: 150 })
					return
				}
				if (e.key === '-') {
					e.preventDefault()
					graph.zoomBy(0.9, { duration: 150 })
					return
				}
				if (e.key === '0') {
					e.preventDefault()
					graph.fitView()
					return
				}
				if (
					e.key === 'ArrowUp' ||
					e.key === 'ArrowDown' ||
					e.key === 'ArrowLeft' ||
					e.key === 'ArrowRight'
				) {
					e.preventDefault()
					const step = 30
					const dx =
						e.key === 'ArrowLeft' ? step : e.key === 'ArrowRight' ? -step : 0
					const dy =
						e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0
					graph.translateBy([dx, dy])
				}
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
	<div
		class="details-panel"
		role="status"
		aria-live="polite"
		data-visible={hoveredId ? 'true' : 'false'}
	>
		{#if hoveredId}
			{@const hoveredNode = model.nodes.find((n) => n.id === hoveredId)}
			{@const hoveredEdge = model.edges.find((e) => e.id === hoveredId)}
			{#if hoveredNode}
				<strong>{hoveredNode.label}</strong>
				{#if hoveredNode.details?.description}
					<p>{hoveredNode.details.description}</p>
				{/if}
			{:else if hoveredEdge}
				<strong>{hoveredEdge.source} → {hoveredEdge.target}</strong>
				<p>{hoveredEdge.label}</p>
			{/if}
		{/if}
	</div>
</div>

<style>
	.architecture-graph-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
		min-height: 400px;
		position: relative;
	}
	.graph-container {
		flex: 1;
		min-height: 0;
		border-radius: 0.5rem;
		background: var(--color-surface, #f1f5f9);
		outline: 1px solid var(--color-border, #e2e8f0);
		touch-action: none;
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
		position: absolute;
		left: 0.75rem;
		right: 0.75rem;
		bottom: 0.75rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		background: var(--color-surface, #f1f5f9);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.375rem;
		transition: opacity 120ms ease;
		pointer-events: none;
	}
	.details-panel[data-visible='false'] {
		opacity: 0;
		pointer-events: none;
	}
	:global(.g6-tooltip) {
		pointer-events: none;
	}
	.details-panel strong {
		display: block;
	}
	.details-panel p {
		margin: 0.25rem 0 0;
		color: var(--color-muted, #64748b);
	}
</style>
