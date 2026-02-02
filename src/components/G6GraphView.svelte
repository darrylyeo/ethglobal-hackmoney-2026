<script lang="ts">
	// Types/constants
	import type { EdgeData, Graph as G6Graph, NodeData } from '@antv/g6'
	import type { GraphModel } from '$/lib/graph-model'

	// Functions
	import { Graph, EdgeEvent, NodeEvent } from '@antv/g6'
	import { ENTITY_TYPE } from '$/constants/entity-types'

	// Props
	let {
		model,
		refreshKey,
		highlightedNodes = [],
		selectedNodes = [],
		selectedEdges = [],
		selectionCount = 0,
		onSelectionChange,
		onNodeEnter,
		onNodeLeave,
	}: {
		model: GraphModel
		refreshKey?: unknown
		highlightedNodes?: string[]
		selectedNodes?: string[]
		selectedEdges?: string[]
		selectionCount?: number
		onSelectionChange?: (selection: {
			nodes: string[]
			edges: string[]
		}) => void
		onNodeEnter?: (node: string) => void
		onNodeLeave?: (node: string) => void
	} = $props()
</script>

<div
	class="graph-container"
	role="application"
	tabindex="0"
	aria-label={`Graph visualization with ${selectionCount} selected`}
	{@attach (container) => {
		let graph: G6Graph | undefined
		let resizeObserver: ResizeObserver | undefined
		const reducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)',
		).matches
		const prefersDark = window.matchMedia(
			'(prefers-color-scheme: dark)',
		).matches
		const labelBackgroundFill = prefersDark
			? 'rgba(15, 23, 42, 0.9)'
			: 'rgba(255, 255, 255, 0.9)'
		const labelFill = prefersDark ? '#e2e8f0' : '#0f172a'

		const getNodeType = (node: GraphModel['nodes'][number]) =>
			node.type === 'image' || node.image
				? 'image'
				: node.collection === ENTITY_TYPE.actorCoin
					? 'donut'
					: node.collection === ENTITY_TYPE.bridgeRoute
						? 'rect'
						: node.collection === ENTITY_TYPE.transaction
							? 'diamond'
							: 'circle'

		const getEdgeType = (edgeType?: string) =>
			typeof edgeType === 'string' && edgeType.includes('curved')
				? 'cubic'
				: 'line'

		const getEdgeArrow = (edgeType?: string) =>
			typeof edgeType === 'string' && edgeType.includes('Arrow')

		const getNodeData = (node: GraphModel['nodes'][number]): NodeData => {
			const baseStyle = {
				x: node.x,
				y: node.y,
				size: node.size ?? 10,
				fill: node.color ?? '#64748b',
				stroke: node.color ?? '#475569',
				labelText: node.label ?? node.id,
				labelBackground: true,
				labelBackgroundFill,
				labelBackgroundRadius: 6,
				labelPadding: [4, 8],
				labelFill,
				labelFontSize: 10,
			}

			return {
				id: node.id,
				type: getNodeType(node),
				data: {
					label: node.label ?? node.id,
					collection: node.collection,
					details: node.details ?? {},
				},
				style: node.image ? { ...baseStyle, src: node.image } : baseStyle,
			}
		}

		const getEdgeData = (edge: GraphModel['edges'][number]): EdgeData => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			type: getEdgeType(edge.type),
			data: {
				relation: edge.relation ?? 'edge',
			},
			style: {
				stroke: edge.color ?? '#94a3b8',
				lineWidth: edge.size ?? 1,
				endArrow: getEdgeArrow(edge.type),
				lineDash: edge.relation === 'allowance' ? [4, 4] : undefined,
				labelText: edge.relation ?? '',
				labelBackground: true,
				labelBackgroundFill,
				labelBackgroundRadius: 5,
				labelPadding: [2, 6],
				labelFill,
				labelFontSize: 9,
				labelAutoRotate: true,
			},
		})

		const buildData = () => ({
			nodes: model.nodes.map((node) => getNodeData(node)),
			edges: model.edges.map((edge) => getEdgeData(edge)),
		})

		const syncSelection = () => {
			if (!graph) return
			const nodes = graph
				.getElementDataByState('node', 'selected')
				.map((node) => node.id)
			const edges = graph
				.getElementDataByState('edge', 'selected')
				.map((edge) => edge.id)
			onSelectionChange?.({ nodes, edges })
		}

		const updateHighlightStates = () => {
			if (!graph) return
			const highlightedSet = new Set(highlightedNodes ?? [])
			for (const node of model.nodes) {
				const states = graph
					.getElementState(node.id)
					.filter((state) => state !== 'highlight')
				graph.setElementState(
					node.id,
					highlightedSet.has(node.id) ? [...states, 'highlight'] : states,
				)
			}
		}

		const updateSelectionStates = () => {
			if (!graph) return
			const selectedNodeSet = new Set(selectedNodes ?? [])
			const selectedEdgeSet = new Set(selectedEdges ?? [])
			for (const node of model.nodes) {
				const states = graph
					.getElementState(node.id)
					.filter((state) => state !== 'selected')
				graph.setElementState(
					node.id,
					selectedNodeSet.has(node.id) ? [...states, 'selected'] : states,
				)
			}
			for (const edge of model.edges) {
				const states = graph
					.getElementState(edge.id)
					.filter((state) => state !== 'selected')
				graph.setElementState(
					edge.id,
					selectedEdgeSet.has(edge.id) ? [...states, 'selected'] : states,
				)
			}
		}

		const clearSelection = () => {
			if (!graph) return
			for (const node of model.nodes) {
				const states = graph
					.getElementState(node.id)
					.filter((state) => state !== 'selected')
				graph.setElementState(node.id, states)
			}
			for (const edge of model.edges) {
				const states = graph
					.getElementState(edge.id)
					.filter((state) => state !== 'selected')
				graph.setElementState(edge.id, states)
			}
			onSelectionChange?.({ nodes: [], edges: [] })
		}

		const focusSelection = () => {
			if (!graph || selectedNodes.length === 0) return
			const [first] = selectedNodes
			const focusElement = graph.focusElement
			if (typeof focusElement === 'function' && first) {
				focusElement.call(graph, first)
			}
		}

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
					highlight: {
						lineWidth: 2,
						halo: true,
						haloLineWidth: 5,
						haloStroke: '#f59e0b',
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
							update: [
								{
									fields: ['x', 'y'],
									duration: 250,
								},
							],
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
					highlight: {
						lineWidth: 2,
						halo: true,
						haloLineWidth: 5,
						haloStroke: '#f59e0b',
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
							update: [
								{
									fields: ['controlPoints'],
									duration: 250,
								},
							],
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
					trigger: {
						zoomIn: ['+'],
						zoomOut: ['-'],
						reset: ['0'],
					},
				},
				{ type: 'drag-element' },
				{ type: 'click-select' },
				{
					type: 'brush-select',
					trigger: ['Shift'],
					enableElements: ['node', 'edge'],
				},
				{ type: 'hover-activate' },
				{ type: 'focus-element' },
			],
			plugins: [
				{
					type: 'tooltip',
					getContent: (_event, items) => {
						const [item] = items ?? []
						if (!item) return ''
						const details = item.data?.details ?? {}
						const detailsMarkup = Object.entries(details)
							.filter(
								(entry) =>
									entry[1] !== undefined &&
									entry[1] !== null &&
									entry[1] !== '',
							)
							.map(
								([key, value]) =>
									`<div><strong>${key}:</strong> ${String(value)}</div>`,
							)
							.join('')
						return `
							<div>
								<strong>${item.data?.label ?? item.id}</strong>
								<div>${item.data?.collection ?? ''}</div>
								${detailsMarkup}
							</div>
						`
					},
				},
			],
		})

		graph.render()
		updateHighlightStates()
		updateSelectionStates()

		graph.on(NodeEvent.CLICK, () => syncSelection())
		graph.on(EdgeEvent.CLICK, () => syncSelection())
		graph.on(NodeEvent.POINTER_OVER, (event) => {
			const targetId =
				typeof event.target?.id === 'string' ? event.target.id : undefined
			if (targetId) onNodeEnter?.(targetId)
		})
		graph.on(NodeEvent.POINTER_OUT, (event) => {
			const targetId =
				typeof event.target?.id === 'string' ? event.target.id : undefined
			if (targetId) onNodeLeave?.(targetId)
		})

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				clearSelection()
			}
			if (event.key === 'Enter') {
				focusSelection()
			}
		}

		container.addEventListener('keydown', handleKeydown)

		resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0]
			if (!entry || !graph) return
			const nextWidth = Math.max(1, entry.contentRect.width)
			const nextHeight = Math.max(1, entry.contentRect.height)
			const resize = graph.resize
			if (typeof resize === 'function') {
				resize.call(graph, nextWidth, nextHeight)
			}
		})
		resizeObserver.observe(container)

		$effect(() => {
			const key = refreshKey
			if (!graph) return
			graph.setData(buildData())
			graph.render()
			updateHighlightStates()
			updateSelectionStates()
			const fitView = graph.fitView
			const fitCenter = graph.fitCenter
			if (typeof fitView === 'function') {
				fitView.call(graph)
			} else if (typeof fitCenter === 'function') {
				fitCenter.call(graph)
			}
		})

		$effect(() => {
			if (!graph) return
			updateHighlightStates()
		})

		$effect(() => {
			if (!graph) return
			updateSelectionStates()
		})

		return () => {
			container.removeEventListener('keydown', handleKeydown)
			resizeObserver?.disconnect()
			graph?.destroy()
			graph = undefined
		}
	}}
></div>

<style>
	.graph-container {
		width: 100%;
		height: 100%;
	}
</style>
