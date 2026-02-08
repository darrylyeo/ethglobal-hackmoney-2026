<script lang="ts">
	// Types/constants
	import type { EdgeData, Graph as G6Graph, NodeData } from '@antv/g6'
	import type { GraphModel } from '$/lib/graphModel.ts'
	import { EntityType, entityTypes } from '$/data/$EntityType.ts'


	// Functions
	import { untrack } from 'svelte'
	import { Graph, EdgeEvent, NodeEvent } from '@antv/g6'
	import {
		finalizeIntentDragPreview,
		startIntentDragPreview,
		updateIntentDragTarget,
	} from '$/state/intent-drag-preview.svelte.ts'


	// Props
	let {
		model,
		highlightedNodes = [],
		globalHighlightedNodes = [],
		selection = $bindable({ nodes: [] as string[], edges: [] as string[] }),
		onNodeEnter,
		onNodeLeave,
	}: {
		model: GraphModel
		highlightedNodes?: string[]
		globalHighlightedNodes?: string[]
		selection?: { nodes: string[]; edges: string[] }
		onNodeEnter?: (node: string) => void
		onNodeLeave?: (node: string) => void
	} = $props()
</script>


<div
	class="graph-container"
	role="application"
	tabindex="0"
	aria-label={`Graph visualization with ${selection.nodes.length + selection.edges.length} selected`}
	{@attach (container) => {
		// --- Static config ---

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
		const labelBackgroundFill = prefersDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)'
		const labelFill = prefersDark ? '#e2e8f0' : '#0f172a'


		// --- Helpers ---

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

		const VALUE_RELATIONS = new Set([
			'balance', 'coin', 'transaction', 'swap', 'yellow', 'transferRequest',
		])

		const getNodeData = (node: GraphModel['nodes'][number]): NodeData => ({
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
			style: {
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
				...(node.g6Style ?? {}),
				...(node.image ? { src: node.image } : {}),
			},
		})

		const getEdgeData = (edge: GraphModel['edges'][number]): EdgeData => {
			const relation = edge.relation ?? 'edge'
			const directed = getEdgeArrow(edge.type) ?? relation !== 'connection'
			const isAllowance = relation === 'allowance'
			const isValue = VALUE_RELATIONS.has(relation)
			return {
				id: edge.id,
				source: edge.source,
				target: edge.target,
				type: getEdgeType(edge),
				data: { relation, disabled: edge.disabled ?? false },
				style: {
					stroke: edge.color ?? '#94a3b8',
					lineWidth: isValue ? Math.max(edge.size ?? 1, 1.5) : (edge.size ?? 1),
					endArrow: directed,
					endArrowType: isAllowance ? 'triangle' : 'vee',
					endArrowSize: isAllowance ? 10 : 8,
					lineDash: isAllowance ? [4, 4] : undefined,
					lineDashOffset: isValue && !reducedMotion ? 0 : undefined,
					zIndex: isAllowance ? 2 : isValue ? 1.5 : 1,
					halo: isAllowance || isValue,
					haloLineWidth: isAllowance ? 4 : isValue ? 3 : undefined,
					haloStroke: (isAllowance || isValue) ? (edge.color ?? '#94a3b8') : undefined,
					haloStrokeOpacity: isAllowance ? 0.25 : isValue ? 0.15 : undefined,
					shadowBlur: relation !== 'edge' && !isAllowance ? 4 : undefined,
					shadowColor: relation !== 'edge' && !isAllowance ? 'rgba(0,0,0,0.15)' : undefined,
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

		const buildData = () => {
			const collections = [...new Set(model.nodes.map((node) => node.collection))]
			return {
				nodes: model.nodes.map(getNodeData),
				edges: model.edges.map(getEdgeData),
				combos: collections.map((collection) => {
					const fill = model.nodes.find((n) => n.collection === collection)?.color ?? '#64748b'
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
				}),
			}
		}


		// --- Graph instance (no reactive reads – data populated by nested $effect) ---

		const snapshot = <T,>(value: T) => $state.snapshot(value) as T

		const { width, height } = container.getBoundingClientRect()

		const graph = new Graph({
			container,
			width,
			height,
			autoFit: 'center',
			data: { nodes: [], edges: [], combos: [] },
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
					: { update: [{ fields: ['x', 'y'], duration: 250 }] },
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
					: { update: [{ fields: ['controlPoints'], duration: 250 }] },
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
					: { update: [{ fields: ['x', 'y', 'width', 'height'], duration: 250 }] },
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
					getContent: (_event: unknown, items: unknown) => {
						const [item] = (items ?? []) as { id?: string, data?: Record<string, unknown> }[]
						if (!item) return ''
						const details = (item.data?.details ?? {}) as Record<string, unknown>
						const detailsMarkup = Object.entries(details)
							.filter(([, v]) => v !== undefined && v !== null && v !== '')
							.map(([key, value]) => `<div><strong>${key}:</strong> ${String(value)}</div>`)
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

		// --- Intent drag ---

		let intentById = new Map<string, GraphModel['nodes'][number]['intent']>()
		let sourceIntent: GraphModel['nodes'][number]['intent'] | null = null
		let sourceProxy: HTMLDivElement | null = null
		let targetProxy: HTMLDivElement | null = null

		const getEventTargetId = (event: unknown) =>
			isRecord(event) &&
			isRecord(event.target) &&
			typeof event.target.id === 'string'
				? event.target.id
				: null

		const ensureProxy = (role: 'source' | 'target') => {
			const current = role === 'source' ? sourceProxy : targetProxy
			if (current) return current
			const el = document.createElement('div')
			Object.assign(el.style, {
				position: 'fixed',
				width: '1px',
				height: '1px',
				pointerEvents: 'none',
				transform: 'translate(-50%, -50%)',
				opacity: '0',
				zIndex: '60',
			})
			el.dataset.intentRole = role
			document.body.appendChild(el)
			if (role === 'source') sourceProxy = el
			else targetProxy = el
			return el
		}

		const toClientPoint = (event: unknown, nodeId: string) => {
			if (isRecord(event)) {
				const x = getNumber(event.clientX)
				const y = getNumber(event.clientY)
				if (x !== null && y !== null) return { x, y }
			}
			const node = model.nodes.find((entry) => entry.id === nodeId)
			if (!node) return null
			const fn = (graph as unknown as { getClientByPoint?(x: number, y: number): unknown }).getClientByPoint
			if (typeof fn === 'function') {
				const point = fn.call(graph, node.x, node.y)
				if (isRecord(point)) {
					const x = getNumber(point.x)
					const y = getNumber(point.y)
					if (x !== null && y !== null) return { x, y }
				}
			}
			const rect = container.getBoundingClientRect()
			return { x: rect.left + node.x, y: rect.top + node.y }
		}

		const startIntentDrag = (nodeId: string, event: unknown) => {
			const sourceId = (
				selection.nodes.length > 1 && selection.nodes.includes(nodeId) && intentById.get(selection.nodes[0])
					? selection.nodes[0]
					: nodeId
			)
			const payload = intentById.get(sourceId)
			if (!payload) return
			const proxy = ensureProxy('source')
			const point = toClientPoint(event, sourceId)
			if (!point) return
			proxy.style.left = `${point.x}px`
			proxy.style.top = `${point.y}px`
			sourceIntent = payload
			startIntentDragPreview({ payload, element: proxy })
		}

		const updateIntentTarget = (nodeId: string, event: unknown) => {
			if (!sourceIntent || !sourceProxy) return
			const payload = intentById.get(nodeId)
			if (!payload) {
				updateIntentDragTarget({ payload: sourceIntent, element: sourceProxy })
				return
			}
			const proxy = ensureProxy('target')
			const point = toClientPoint(event, nodeId)
			if (!point) return
			proxy.style.left = `${point.x}px`
			proxy.style.top = `${point.y}px`
			updateIntentDragTarget({ payload, element: proxy })
		}


		// --- Helpers: apply element states ---

		const applyStates = () => {
			const localHighlights = new Set(highlightedNodes)
			const globalHighlights = new Set(globalHighlightedNodes)
			const selectedNodes = new Set(selection.nodes)
			const selectedEdges = new Set(selection.edges)

			for (const node of graph.getNodeData()) {
				const id = node.id
				if (!id) continue
				const disabled = !!(node.data as Record<string, unknown>)?.disabled
				const kept = (() => {
					try {
						const raw = graph.getElementState(id)
						return (Array.isArray(raw) ? raw : []).filter((s) =>
							s !== 'highlight' && s !== 'globalHighlight' && s !== 'selected' && s !== 'disabled'
						)
					} catch {
						return [] as string[]
					}
				})()
				;(graph.setElementState(id, [
					...kept,
					...(localHighlights.has(id) ? ['highlight'] : globalHighlights.has(id) ? ['globalHighlight'] : []),
					...(selectedNodes.has(id) ? ['selected'] : []),
					...(disabled ? ['disabled'] : []),
				]) as Promise<void>)?.catch?.(() => {})
			}

			for (const edge of graph.getEdgeData()) {
				const id = edge.id
				if (!id) continue
				const disabled = !!(edge.data as Record<string, unknown>)?.disabled
				const kept = (() => {
					try {
						const raw = graph.getElementState(id)
						return (Array.isArray(raw) ? raw : []).filter((s) =>
							s !== 'selected' && s !== 'disabled'
						)
					} catch {
						return [] as string[]
					}
				})()
				;(graph.setElementState(id, [
					...kept,
					...(selectedEdges.has(id) ? ['selected'] : []),
					...(disabled ? ['disabled'] : []),
				]) as Promise<void>)?.catch?.(() => {})
			}
		}


		// --- Effect: data sync (model reference → setData + render) ---

		$effect(() => {
			void model
			let cancelled = false

			untrack(() => {
				const data = snapshot(buildData())

				intentById = new Map(
					model.nodes
						.filter((n) => n.intent)
						.map((n) => [n.id, n.intent]),
				)

				graph.setData(data)
				graph.render()
					.then(() => {
						if (cancelled) return
						graph.fitView?.().catch(() => {})
						applyStates()
					})
					.catch(() => {})
			})

			return () => { cancelled = true }
		})


		// --- Effect: state sync (highlights/selection → setElementState only, no render) ---

		$effect(() => {
			void highlightedNodes
			void globalHighlightedNodes
			void selection.nodes
			void selection.edges

			untrack(() => {
				applyStates()
			})
		})


		// --- Events ---

		const syncSelection = () => {
			selection = {
				nodes: graph
					.getElementDataByState('node', 'selected')
					.map((n) => n.id)
					.filter((id): id is string => id != null),
				edges: graph
					.getElementDataByState('edge', 'selected')
					.map((e) => e.id)
					.filter((id): id is string => id != null),
			}
		}

		graph.on(NodeEvent.CLICK, () => syncSelection())
		graph.on(EdgeEvent.CLICK, () => syncSelection())

		graph.on(NodeEvent.POINTER_OVER, (event) => {
			const id = getEventTargetId(event)
			if (id) {
				try {
					const raw = graph.getElementState(id)
					const states = (Array.isArray(raw) ? raw : []).filter((s) => s !== 'hover')
					;(graph.setElementState(id, [...states, 'hover']) as Promise<void>)?.catch?.(() => {})
				} catch {}
				onNodeEnter?.(id)
			}
		})
		graph.on(NodeEvent.POINTER_OUT, (event) => {
			const id = getEventTargetId(event)
			if (id) {
				try {
					const raw = graph.getElementState(id)
					const states = (Array.isArray(raw) ? raw : []).filter((s) => s !== 'hover')
					;(graph.setElementState(id, states) as Promise<void>)?.catch?.(() => {})
				} catch {}
				onNodeLeave?.(id)
			}
		})

		graph.on(NodeEvent.DRAG_START, (event) => {
			const id = getEventTargetId(event)
			if (id) startIntentDrag(id, event)
		})
		graph.on(NodeEvent.DRAG, (event) => {
			const id = getEventTargetId(event)
			if (id) updateIntentTarget(id, event)
		})
		graph.on(NodeEvent.DRAG_ENTER, (event) => {
			const id = getEventTargetId(event)
			if (id) updateIntentTarget(id, event)
		})
		graph.on(NodeEvent.DRAG_LEAVE, () => {
			if (sourceIntent && sourceProxy)
				updateIntentDragTarget({ payload: sourceIntent, element: sourceProxy })
		})
		graph.on(NodeEvent.DROP, (event) => {
			const id = getEventTargetId(event)
			if (id) updateIntentTarget(id, event)
		})
		graph.on(NodeEvent.DRAG_END, () => {
			finalizeIntentDragPreview()
			sourceIntent = null
		})


		// --- Keyboard ---

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape')
				selection = { nodes: [], edges: [] }
			if (event.key === 'Enter' && selection.nodes[0])
				graph.focusElement?.(selection.nodes[0])?.catch?.(() => {})
		}
		container.addEventListener('keydown', handleKeydown)


		// --- Resize ---

		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0]
			if (!entry) return
			;(graph.resize(
				Math.max(1, entry.contentRect.width),
				Math.max(1, entry.contentRect.height),
			) as unknown as Promise<void>)?.catch?.(() => {})
		})
		resizeObserver.observe(container)


		// --- Cleanup ---

		return () => {
			container.removeEventListener('keydown', handleKeydown)
			sourceProxy?.remove()
			targetProxy?.remove()
			resizeObserver.disconnect()
			graph.destroy()
		}
	}}
></div>


<style>
	.graph-container {
		:global(*) {
			font-family: inherit !important;
		}
	}
</style>
