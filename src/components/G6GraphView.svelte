<script lang="ts">


	// Types/constants
	import type { EdgeData, Graph as G6Graph, NodeData } from '@antv/g6'
	import type { GraphModel } from '$/lib/graph-model.ts'
	import { entityTypes } from '$/constants/entity-types.ts'


	// Functions
	import { Graph, EdgeEvent, NodeEvent } from '@antv/g6'
	import { EntityType } from '$/data/$EntityType.ts'
	import {
		finalizeIntentDragPreview,
		startIntentDragPreview,
		updateIntentDragTarget,
	} from '$/state/intent-drag-preview.svelte'


	// Props
	let {
		model,
		refreshKey,
		highlightedNodes = [],
		globalHighlightedNodes = [],
		selection = $bindable({ nodes: [] as string[], edges: [] as string[] }),
		onNodeEnter,
		onNodeLeave,
	}: {
		model: GraphModel
		refreshKey?: unknown
		highlightedNodes?: string[]
		globalHighlightedNodes?: string[]
		selection?: { nodes: string[]; edges: string[] }
		onNodeEnter?: (node: string) => void
		onNodeLeave?: (node: string) => void
	} = $props()


	// (Derived)
	const selectionCount = $derived(selection.nodes.length + selection.edges.length)
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

		const isRecord = (value: unknown): value is Record<string, unknown> =>
			typeof value === 'object' && value !== null

		const getNumber = (value: unknown): number | null =>
			typeof value === 'number' ? value : null

		const getCollectionLabel = (collection: string) =>
			entityTypes.find((e) => e.type === collection)?.labelPlural ?? collection

		const getNodeType = (node: GraphModel['nodes'][number]) =>
			node.g6Type ??
			(node.type === 'image' || node.image
				? 'image'
				: node.collection === EntityType.ActorCoin
					? 'donut'
					: node.collection === EntityType.BridgeRoute
						? 'rect'
						: node.collection === EntityType.Transaction
							? 'diamond'
							: 'circle')

		const getEdgeTypeFromRelation = (relation?: string) =>
			relation === 'connection'
				? 'cubic'
				: relation === 'allowance'
					? 'quadratic'
					: 'line'

		const getEdgeType = (edge: GraphModel['edges'][number]) =>
			typeof edge.type === 'string' && edge.type.includes('curved')
				? 'cubic'
				: getEdgeTypeFromRelation(edge.relation)

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
			const style = {
				...baseStyle,
				...(node.g6Style ?? {}),
			}

			return {
				id: node.id,
				combo: `combo-${node.collection}`,
				type: getNodeType(node),
				data: {
					label: node.label ?? node.id,
					collection: node.collection,
					details: node.details ?? {},
					intent: node.intent ?? null,
					disabled: node.disabled ?? false,
				},
				style: node.image ? { ...style, src: node.image } : style,
			}
		}

		const getEdgeData = (edge: GraphModel['edges'][number]): EdgeData => {
			const relation = edge.relation ?? 'edge'
			const directed = getEdgeArrow(edge.type) ?? relation !== 'connection'
			const isAllowance = relation === 'allowance'
			return {
				id: edge.id,
				source: edge.source,
				target: edge.target,
				type: getEdgeType(edge),
				data: {
					relation,
					disabled: edge.disabled ?? false,
				},
				style: {
					stroke: edge.color ?? '#94a3b8',
					lineWidth: edge.size ?? 1,
					endArrow: directed,
					endArrowType: isAllowance ? 'triangle' : 'vee',
					endArrowSize: isAllowance ? 10 : 8,
					lineDash: isAllowance ? [4, 4] : undefined,
					zIndex: isAllowance ? 2 : 1,
					halo: isAllowance,
					haloLineWidth: isAllowance ? 4 : undefined,
					haloStroke: isAllowance ? (edge.color ?? '#94a3b8') : undefined,
					haloStrokeOpacity: isAllowance ? 0.25 : undefined,
					shadowBlur: relation !== 'edge' && !isAllowance ? 4 : undefined,
					shadowColor:
						relation !== 'edge' && !isAllowance
							? 'rgba(0,0,0,0.15)'
							: undefined,
					labelText: relation !== 'edge' ? relation : '',
					labelBackground: true,
					labelBackgroundFill,
					labelBackgroundRadius: 5,
					labelPadding: [2, 6],
					labelFill,
					labelFontSize: 9,
					labelAutoRotate: true,
					...(edge.g6Style ?? {}),
				},
			}
		}

		let intentById = new Map<string, GraphModel['nodes'][number]['intent']>()
		let sourceIntent: GraphModel['nodes'][number]['intent'] | null = null
		let sourceProxy: HTMLDivElement | null = null
		let targetProxy: HTMLDivElement | null = null

		const buildData = () => {
			intentById = new Map(
				model.nodes
					.filter((node) => node.intent)
					.map((node) => [node.id, node.intent]),
			)
			const collections = [
				...new Set(model.nodes.map((node) => node.collection)),
			]
			const combos = collections.map((collection) => {
				const firstNode = model.nodes.find((n) => n.collection === collection)
				const fill = firstNode?.color ?? '#64748b'
				return {
					id: `combo-${collection}`,
					type: 'rect' as const,
					data: { label: getCollectionLabel(collection) },
					style: {
						fill,
						fillOpacity: prefersDark ? 0.08 : 0.14,
						stroke: fill,
						strokeOpacity: 0.35,
						lineWidth: 1,
						labelText: getCollectionLabel(collection),
						labelPlacement: 'top' as const,
						labelBackground: true,
						labelBackgroundFill,
						labelBackgroundRadius: 6,
						labelPadding: [2, 6],
						labelFill,
						labelFontSize: 11,
						zIndex: 0,
					},
				}
			})
			return {
				nodes: model.nodes.map((node) => getNodeData(node)),
				edges: model.edges.map((edge) => getEdgeData(edge)),
				combos,
			}
		}

		const getEventTargetId = (event: unknown) =>
			isRecord(event) &&
			isRecord(event.target) &&
			typeof event.target.id === 'string'
				? event.target.id
				: null

		const getIntentPayload = (nodeId: string) => intentById.get(nodeId) ?? null

		const ensureProxy = (role: 'source' | 'target') => {
			const current = role === 'source' ? sourceProxy : targetProxy
			if (current) return current
			const next = document.createElement('div')
			next.className = 'graph-intent-proxy'
			next.dataset.intentRole = role
			document.body.appendChild(next)
			if (role === 'source') {
				sourceProxy = next
			} else {
				targetProxy = next
			}
			return next
		}

		const toClientPoint = (event: unknown, nodeId: string) => {
			if (isRecord(event)) {
				const x = getNumber(event.clientX)
				const y = getNumber(event.clientY)
				if (x !== null && y !== null) return { x, y }
			}
			const node = model.nodes.find((entry) => entry.id === nodeId)
			if (!node) return null
			const getClientByPoint = graph?.getClientByPoint
			if (typeof getClientByPoint === 'function') {
				const point = getClientByPoint.call(graph, node.x, node.y)
				if (isRecord(point)) {
					const x = getNumber(point.x)
					const y = getNumber(point.y)
					if (x !== null && y !== null) return { x, y }
				}
			}
			const rect = container.getBoundingClientRect()
			return { x: rect.left + node.x, y: rect.top + node.y }
		}

		const setProxyPosition = (
			proxy: HTMLDivElement,
			point: { x: number; y: number },
		) => {
			proxy.style.left = `${point.x}px`
			proxy.style.top = `${point.y}px`
		}

		const getDragSourceId = (nodeId: string) => {
			if (selection.nodes.length > 1 && selection.nodes.includes(nodeId)) {
				const primary = selection.nodes[0]
				if (primary && getIntentPayload(primary)) return primary
			}
			return nodeId
		}

		const startIntentDrag = (nodeId: string, event: unknown) => {
			const sourceId = getDragSourceId(nodeId)
			const payload = getIntentPayload(sourceId)
			if (!payload) return
			const proxy = ensureProxy('source')
			const point = toClientPoint(event, sourceId)
			if (!point) return
			setProxyPosition(proxy, point)
			sourceIntent = payload
			startIntentDragPreview({ payload, element: proxy })
		}

		const updateIntentTarget = (nodeId: string, event: unknown) => {
			if (!sourceIntent || !sourceProxy) return
			const payload = getIntentPayload(nodeId)
			if (!payload) {
				updateIntentDragTarget({ payload: sourceIntent, element: sourceProxy })
				return
			}
			const proxy = ensureProxy('target')
			const point = toClientPoint(event, nodeId)
			if (!point) return
			setProxyPosition(proxy, point)
			updateIntentDragTarget({ payload, element: proxy })
		}

		const clearIntentTarget = () => {
			if (sourceIntent && sourceProxy) {
				updateIntentDragTarget({ payload: sourceIntent, element: sourceProxy })
			}
		}

		const finalizeIntentDrag = () => {
			finalizeIntentDragPreview()
			sourceIntent = null
		}

		const syncSelection = () => {
			if (!graph) return
			const nodes = graph
				.getElementDataByState('node', 'selected')
				.map((node) => node.id)
				.filter((id): id is string => id != null)
			const edges = graph
				.getElementDataByState('edge', 'selected')
				.map((edge) => edge.id)
				.filter((id): id is string => id != null)
			selection = { nodes, edges }
		}

		const updateHighlightStates = () => {
			if (!graph) return
			const localSet = new Set(highlightedNodes ?? [])
			const globalSet = new Set(globalHighlightedNodes ?? [])
			for (const node of model.nodes) {
				const states = graph
					.getElementState(node.id)
					.filter((s) => s !== 'highlight' && s !== 'globalHighlight')
				const next = localSet.has(node.id)
					? [...states, 'highlight']
					: globalSet.has(node.id)
						? [...states, 'globalHighlight']
						: states
				graph.setElementState(node.id, next)
			}
		}

		const updateSelectionStates = () => {
			if (!graph) return
			const selectedNodeSet = new Set(selection.nodes)
			const selectedEdgeSet = new Set(selection.edges)
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

		const updateDisabledStates = () => {
			if (!graph) return
			for (const node of model.nodes) {
				const states = graph
					.getElementState(node.id)
					.filter((state) => state !== 'disabled')
				graph.setElementState(
					node.id,
					node.disabled ? [...states, 'disabled'] : states,
				)
			}
			for (const edge of model.edges) {
				const states = graph
					.getElementState(edge.id)
					.filter((state) => state !== 'disabled')
				graph.setElementState(
					edge.id,
					edge.disabled ? [...states, 'disabled'] : states,
				)
			}
		}

		const setHoverState = (nodeId: string, isHovered: boolean) => {
			if (!graph) return
			const states = graph
				.getElementState(nodeId)
				.filter((state) => state !== 'hover')
			graph.setElementState(nodeId, isHovered ? [...states, 'hover'] : states)
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
			selection = { nodes: [], edges: [] }
		}

		const focusSelection = () => {
			if (!graph || selection.nodes.length === 0) return
			const [first] = selection.nodes
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
					globalHighlight: {
						opacity: 0.5,
						lineWidth: 1.5,
						halo: true,
						haloLineWidth: 3,
						haloStroke: '#f59e0b',
						haloStrokeOpacity: 0.2,
					},
					hover: {
						lineWidth: 2,
						halo: true,
						haloLineWidth: 4,
						haloStroke: '#38bdf8',
						haloStrokeOpacity: 0.25,
					},
					active: {
						lineWidth: 2,
						halo: true,
						haloLineWidth: 4,
						haloStroke: '#38bdf8',
						haloStrokeOpacity: 0.35,
					},
					disabled: {
						opacity: 0.35,
						labelFill: prefersDark ? '#94a3b8' : '#64748b',
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
					globalHighlight: {
						opacity: 0.4,
						lineWidth: 1.5,
					},
					hover: {
						lineWidth: 2,
						halo: true,
						haloLineWidth: 4,
						haloStroke: '#38bdf8',
						haloStrokeOpacity: 0.25,
					},
					active: {
						lineWidth: 2,
						halo: true,
						haloLineWidth: 4,
						haloStroke: '#38bdf8',
						haloStrokeOpacity: 0.35,
					},
					disabled: {
						opacity: 0.2,
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
			combo: {
				type: 'rect',
				state: {
					selected: {
						lineWidth: 2,
						stroke: '#60a5fa',
						strokeOpacity: 0.6,
					},
					hover: {
						strokeOpacity: 0.5,
					},
				},
				animation: reducedMotion
					? false
					: {
							update: [
								{ fields: ['x', 'y', 'width', 'height'], duration: 250 },
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
				{ type: 'drag-element', dropEffect: 'link' },
				{ type: 'click-select' },
				{ type: 'collapse-expand' },
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
		updateDisabledStates()

		graph.on(NodeEvent.CLICK, () => syncSelection())
		graph.on(EdgeEvent.CLICK, () => syncSelection())
		graph.on(NodeEvent.POINTER_OVER, (event) => {
			const targetId = getEventTargetId(event)
			if (targetId) {
				setHoverState(targetId, true)
				onNodeEnter?.(targetId)
			}
		})
		graph.on(NodeEvent.POINTER_OUT, (event) => {
			const targetId = getEventTargetId(event)
			if (targetId) {
				setHoverState(targetId, false)
				onNodeLeave?.(targetId)
			}
		})
		graph.on(NodeEvent.DRAG_START, (event) => {
			const targetId = getEventTargetId(event)
			if (targetId) startIntentDrag(targetId, event)
		})
		graph.on(NodeEvent.DRAG, (event) => {
			const targetId = getEventTargetId(event)
			if (targetId) updateIntentTarget(targetId, event)
		})
		graph.on(NodeEvent.DRAG_ENTER, (event) => {
			const targetId = getEventTargetId(event)
			if (targetId) updateIntentTarget(targetId, event)
		})
		graph.on(NodeEvent.DRAG_LEAVE, () => {
			clearIntentTarget()
		})
		graph.on(NodeEvent.DROP, (event) => {
			const targetId = getEventTargetId(event)
			if (targetId) updateIntentTarget(targetId, event)
		})
		graph.on(NodeEvent.DRAG_END, () => {
			finalizeIntentDrag()
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
			updateDisabledStates()
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

		$effect(() => {
			if (!graph) return
			updateDisabledStates()
		})

		return () => {
			container.removeEventListener('keydown', handleKeydown)
			if (sourceProxy) sourceProxy.remove()
			if (targetProxy) targetProxy.remove()
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

	.graph-intent-proxy {
		position: fixed;
		width: 1px;
		height: 1px;
		pointer-events: none;
		transform: translate(-50%, -50%);
		opacity: 0;
		z-index: 60;
	}
</style>
