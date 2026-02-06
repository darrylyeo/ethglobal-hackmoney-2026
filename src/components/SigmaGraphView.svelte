<script lang="ts">


	// Types/constants
	import type Graph from 'graphology'
	import type { Attributes } from 'graphology-types'
	import type { DisplayData } from 'sigma/types'
	import type { Sigma } from 'sigma'
	import type { GraphModel } from '$/lib/graphModel.ts'


	// Props
	let {
		model,
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
		model: GraphModel
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
		onEdgeLeave?: (edge: string) => void,
	} = $props()
</script>


<div
	class="sigma-container"
	{@attach (container) => {
		if (typeof WebGL2RenderingContext === 'undefined') return () => {}

		let renderer: Sigma | undefined
		let layout:
			| { start: () => void; kill: () => void; stop: () => void }
			| undefined
		let draggedNode: string | null = null
		let isDragging = false
		let centerInterval: ReturnType<typeof setInterval> | undefined
		let activeGraph = model.graph
		let modules:
			| {
					EdgeCurveModule: {
						indexParallelEdgesIndex: (
							g: Graph,
							opts: {
								edgeIndexAttribute: string
								edgeMaxIndexAttribute: string
							},
						) => void
						default: unknown
						EdgeCurvedArrowProgram: unknown
					}
					ForceSupervisor: new (
						g: Graph,
						opts: { settings: Record<string, unknown> },
					) => { start: () => void; kill: () => void; stop: () => void }
					forceAtlas2: { inferSettings: (g: Graph) => Record<string, unknown> }
			  }
			| undefined

		const applyGraph = (g: GraphModel['graph']) => {
			if (!renderer || !modules) return
			if (arrangeParallelEdges !== false) {
				modules.EdgeCurveModule.indexParallelEdgesIndex(g, {
					edgeIndexAttribute: 'edgeIndex',
					edgeMaxIndexAttribute: 'edgeCount',
				})
				g.forEachEdge((edge, attrs) => {
					const type = typeof attrs.type === 'string' ? attrs.type : undefined
					const edgeIndex =
						typeof attrs.edgeIndex === 'number' ? attrs.edgeIndex : undefined
					const edgeCount =
						typeof attrs.edgeCount === 'number' ? attrs.edgeCount : undefined
					const curvature =
						typeof edgeIndex === 'number' && typeof edgeCount === 'number'
							? (edgeCount === 1 ? 0 : (edgeIndex / (edgeCount - 1)) * 2 - 1) *
								(1 - Math.exp(-0.1 * edgeCount))
							: 0
					g.mergeEdgeAttributes(edge, {
						type:
							type?.replace(
								/^(?:curved|straight)/,
								curvature !== 0 ? 'curved' : 'straight',
							) ?? 'curved',
						curvature,
					})
				})
			}
			renderer.setGraph(g)
			renderer.refresh()
		}

		$effect(() => {
			const g = model.graph
			const key = refreshKey
			activeGraph = g
			if (!renderer || !modules) return
			applyGraph(g)
			layout?.kill()
			if (enableForce !== false) {
				layout = new modules.ForceSupervisor(g, {
					settings: {
						...modules.forceAtlas2.inferSettings(g),
						adjustSizes: true,
						slowDown: 10,
					},
				})
				layout.start()
			} else {
				layout = undefined
			}
		})

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
			const g = model.graph

			if (centerInterval) clearInterval(centerInterval)

			if (highlightedSet.size > 0) {
				centerInterval = setInterval(() => {
					g.forEachNode((node, attrs) => {
						if (highlightedSet.has(node)) {
							const dx = -attrs.x * force
							const dy = -attrs.y * force
							g.setNodeAttribute(node, 'x', attrs.x + dx)
							g.setNodeAttribute(node, 'y', attrs.y + dy)
						} else {
							const dist = Math.sqrt(attrs.x ** 2 + attrs.y ** 2) || 0.1
							const repelForce = force * 2
							g.setNodeAttribute(
								node,
								'x',
								attrs.x + (attrs.x / dist) * repelForce,
							)
							g.setNodeAttribute(
								node,
								'y',
								attrs.y + (attrs.y / dist) * repelForce,
							)
						}
					})
				}, 50)
			}

			return () => {
				if (centerInterval) clearInterval(centerInterval)
			}
		})

		Promise.all([
			import('sigma'),
			import('graphology-layout-forceatlas2/worker'),
			import('sigma/rendering'),
			import('@sigma/node-image'),
			import('@sigma/edge-curve'),
			import('graphology-layout-forceatlas2'),
		]).then(
			([
				sigmaMod,
				forceWorkerMod,
				sigmaRendering,
				nodeImageMod,
				edgeCurveMod,
				forceAtlas2Mod,
			]) => {
				const SigmaClass = sigmaMod.default
				const ForceSupervisor = forceWorkerMod.default
				const forceAtlas2 = forceAtlas2Mod.default
				const nodeProgramClasses = {
					circle: sigmaRendering.NodeCircleProgram,
					point: sigmaRendering.NodePointProgram,
					image: nodeImageMod.createNodeImageProgram({
						objectFit: 'contain',
						padding: 0.1,
						correctCentering: true,
					}),
					pictogram: nodeImageMod.NodePictogramProgram,
				}

				modules = {
					EdgeCurveModule: edgeCurveMod,
					ForceSupervisor,
					forceAtlas2,
				}

				renderer = new SigmaClass(model.graph, container, {
					defaultEdgeType: 'curved',
					renderLabels: true,
					renderEdgeLabels: true,
					enableEdgeEvents: true,
					nodeProgramClasses,
					nodeHoverProgramClasses: nodeProgramClasses,
					edgeProgramClasses: {
						straight: sigmaRendering.EdgeLineProgram,
						straightArrow: sigmaRendering.EdgeArrowProgram,
						curved: edgeCurveMod.default,
						curvedArrow: edgeCurveMod.EdgeCurvedArrowProgram,
					},
				})

				applyGraph(model.graph)

				if (enableForce !== false) {
					layout = new ForceSupervisor(model.graph, {
						settings: {
							...forceAtlas2.inferSettings(model.graph),
							adjustSizes: true,
							slowDown: 10,
						},
					})
					layout.start()
				}

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

				if (enableDragAndDrop !== false) {
					renderer.on('downNode', (e) => {
						draggedNode = e.node
						activeGraph.setNodeAttribute(draggedNode, 'highlighted', true)
					})

					const mouseCaptor = renderer.getMouseCaptor()

					mouseCaptor.on('mousemovebody', (e) => {
						if (!draggedNode || !renderer) return
						isDragging = true
						layout?.stop()
						const pos = renderer.viewportToGraph(e)
						activeGraph.setNodeAttribute(draggedNode, 'x', pos.x)
						activeGraph.setNodeAttribute(draggedNode, 'y', pos.y)
						e.preventSigmaDefault()
						e.original.preventDefault()
						e.original.stopPropagation()
					})

					mouseCaptor.on('mouseup', () => {
						if (draggedNode)
							activeGraph.removeNodeAttribute(draggedNode, 'highlighted')
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
			},
		)

		return () => {
			if (centerInterval) clearInterval(centerInterval)
			layout?.kill()
			renderer?.kill()
		}
	}}
></div>


<style>
	.sigma-container {
		width: 100%;
		height: 100%;
	}
</style>
