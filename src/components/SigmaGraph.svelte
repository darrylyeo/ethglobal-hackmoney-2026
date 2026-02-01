<script lang="ts">
	// Types
	import type Graph from 'graphology'
	import type { Attributes } from 'graphology-types'
	import type { DisplayData } from 'sigma/types'
	import type { Sigma } from 'sigma'


	// Props
	let {
		graph,
		refreshKey,
		enableForce = true,
		enableDragAndDrop = true,
		arrangeParallelEdges = true,
		highlightedNodes = [],
		centerForce = 0.01,
		edgeReducer,
		nodeReducer,
		hoveredEdge = $bindable<string | undefined>(),
		hoveredNode = $bindable<string | undefined>(),
		onNodeClick,
		onNodeEnter,
		onNodeLeave,
		onEdgeClick,
		onEdgeEnter,
		onEdgeLeave,
	}: {
		graph: Graph
		refreshKey?: unknown
		enableForce?: boolean
		enableDragAndDrop?: boolean
		arrangeParallelEdges?: boolean
		highlightedNodes?: string[]
		centerForce?: number
		edgeReducer?: (edge: string, data: Attributes) => Partial<DisplayData>
		nodeReducer?: (node: string, data: Attributes) => Partial<DisplayData>
		hoveredEdge?: string
		hoveredNode?: string
		onNodeClick?: (node: string) => void
		onNodeEnter?: (node: string) => void
		onNodeLeave?: (node: string) => void
		onEdgeClick?: (edge: string) => void
		onEdgeEnter?: (edge: string) => void
		onEdgeLeave?: (edge: string) => void
	} = $props()
</script>


<div
	{@attach (container) => {
		let renderer: Sigma | undefined
		let layout: import('graphology-layout-forceatlas2/worker').default | undefined
		let draggedNode: string | null = null
		let isDragging = false
		let centerInterval: ReturnType<typeof setInterval> | undefined
		const cleanups: (() => void)[] = []

		const loadModules = async () => {
			const [
				{ default: SigmaClass },
				{ default: ForceSupervisor },
				SigmaRenderingModule,
				NodeImageModule,
				EdgeCurveModule,
				{ default: forceAtlas2 },
			] = await Promise.all([
				import('sigma'),
				import('graphology-layout-forceatlas2/worker'),
				import('sigma/rendering'),
				import('@sigma/node-image'),
				import('@sigma/edge-curve'),
				import('graphology-layout-forceatlas2'),
			])

			const nodeProgramClasses = {
				'circle': SigmaRenderingModule.NodeCircleProgram,
				'point': SigmaRenderingModule.NodePointProgram,
				'image': NodeImageModule.createNodeImageProgram({
					objectFit: 'contain',
					padding: 0.1,
					correctCentering: true,
				}),
				'pictogram': NodeImageModule.NodePictogramProgram,
			}

			renderer = new SigmaClass(
				graph,
				container,
				{
					defaultEdgeType: 'curved',
					renderLabels: true,
					renderEdgeLabels: true,
					enableEdgeEvents: true,
					nodeProgramClasses,
					nodeHoverProgramClasses: nodeProgramClasses,
					edgeProgramClasses: {
						'straight': SigmaRenderingModule.EdgeLineProgram,
						'straightArrow': SigmaRenderingModule.EdgeArrowProgram,
						'curved': EdgeCurveModule.default,
						'curvedArrow': EdgeCurveModule.EdgeCurvedArrowProgram,
					},
				},
			)

			renderer.on('clickNode', ({ node }) => onNodeClick?.(node))
			renderer.on('enterNode', ({ node }) => {
				onNodeEnter?.(node)
				hoveredNode = node
			})
			renderer.on('leaveNode', ({ node }) => {
				onNodeLeave?.(node)
				hoveredNode = undefined
			})
			renderer.on('clickEdge', ({ edge }) => onEdgeClick?.(edge))
			renderer.on('enterEdge', ({ edge }) => {
				onEdgeEnter?.(edge)
				hoveredEdge = edge
			})
			renderer.on('leaveEdge', ({ edge }) => {
				onEdgeLeave?.(edge)
				hoveredEdge = undefined
			})

			if (arrangeParallelEdges !== false) {
				EdgeCurveModule.indexParallelEdgesIndex(graph, {
					edgeIndexAttribute: 'edgeIndex',
					edgeMaxIndexAttribute: 'edgeCount',
				})

				graph.forEachEdge((edge, attrs) => {
					const { type, edgeIndex, edgeCount } = attrs as { type?: string; edgeIndex?: number; edgeCount?: number }
					const curvature = (
						typeof edgeIndex === 'number' && typeof edgeCount === 'number'
							? (edgeCount === 1 ? 0 : edgeIndex / (edgeCount - 1) * 2 - 1) * (1 - Math.exp(-0.1 * edgeCount))
							: 0
					)

					graph.mergeEdgeAttributes(edge, {
						type: type?.replace(/^(?:curved|straight)/, curvature !== 0 ? 'curved' : 'straight') ?? 'curved',
						curvature,
					})
				})

				renderer.setGraph(graph)
				renderer.refresh()
			}

			if (enableForce !== false) {
				layout = new ForceSupervisor(graph, {
					settings: {
						...forceAtlas2.inferSettings(graph),
						adjustSizes: true,
						slowDown: 10,
					},
				})
				layout.start()
				cleanups.push(() => layout?.kill())
			}

			if (enableDragAndDrop !== false) {
				renderer.on('downNode', (e) => {
					draggedNode = e.node
					graph.setNodeAttribute(draggedNode, 'highlighted', true)
				})

				const mouseCaptor = renderer.getMouseCaptor()

				mouseCaptor.on('mousemovebody', (e) => {
					if (!draggedNode || !renderer) return
					isDragging = true
					layout?.stop()
					const pos = renderer.viewportToGraph(e)
					graph.setNodeAttribute(draggedNode, 'x', pos.x)
					graph.setNodeAttribute(draggedNode, 'y', pos.y)
					e.preventSigmaDefault()
					e.original.preventDefault()
					e.original.stopPropagation()
				})

				mouseCaptor.on('mouseup', () => {
					if (draggedNode) graph.removeNodeAttribute(draggedNode, 'highlighted')
					isDragging = false
					draggedNode = null
					layout?.start()
				})

				mouseCaptor.on('mousedown', () => {
					if (renderer && !renderer.getCustomBBox()) {
						renderer.setCustomBBox(renderer.getBBox())
					}
				})
			}

			$effect(() => {
				if (renderer && edgeReducer) {
					renderer.setSetting('edgeReducer', edgeReducer)
				}
				if (renderer && nodeReducer) {
					renderer.setSetting('nodeReducer', nodeReducer)
				}
				renderer?.refresh()
			})

			$effect(() => {
				const highlightedSet = new Set(highlightedNodes ?? [])
				const force = centerForce ?? 0.01

				if (centerInterval) clearInterval(centerInterval)

				if (highlightedSet.size > 0) {
					centerInterval = setInterval(() => {
						graph.forEachNode((node, attrs) => {
							if (highlightedSet.has(node)) {
								const dx = -attrs.x * force
								const dy = -attrs.y * force
								graph.setNodeAttribute(node, 'x', attrs.x + dx)
								graph.setNodeAttribute(node, 'y', attrs.y + dy)
							} else {
								const dist = Math.sqrt(attrs.x ** 2 + attrs.y ** 2) || 0.1
								const repelForce = force * 2
								graph.setNodeAttribute(node, 'x', attrs.x + (attrs.x / dist) * repelForce)
								graph.setNodeAttribute(node, 'y', attrs.y + (attrs.y / dist) * repelForce)
							}
						})
					}, 50)
				}

				return () => {
					if (centerInterval) clearInterval(centerInterval)
				}
			})
		}

		loadModules()

		return () => {
			if (centerInterval) clearInterval(centerInterval)
			cleanups.forEach((fn) => fn())
			renderer?.kill()
		}
	}}
></div>


<style>
	div {
		width: 100%;
		height: 100%;
	}
</style>
