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
		if (typeof WebGL2RenderingContext === 'undefined') return () => {}

		let renderer: Sigma | undefined
		let layout: { start: () => void; kill: () => void; stop: () => void } | undefined
		let draggedNode: string | null = null
		let isDragging = false
		let centerInterval: ReturnType<typeof setInterval> | undefined
		let activeGraph = graph
		let modules:
			| {
				EdgeCurveModule: {
					indexParallelEdgesIndex: (g: Graph, opts: { edgeIndexAttribute: string; edgeMaxIndexAttribute: string }) => void
					default: unknown
					EdgeCurvedArrowProgram: unknown
				}
				ForceSupervisor: new (g: Graph, opts: { settings: Record<string, unknown> }) => { start: () => void; kill: () => void; stop: () => void }
				forceAtlas2: { inferSettings: (g: Graph) => Record<string, unknown> }
			}
			| undefined

		const applyGraph = (g: Graph) => {
			if (!renderer || !modules) return
			if (arrangeParallelEdges !== false) {
				modules.EdgeCurveModule.indexParallelEdgesIndex(g, {
					edgeIndexAttribute: 'edgeIndex',
					edgeMaxIndexAttribute: 'edgeCount',
				})
				g.forEachEdge((edge, attrs) => {
					const { type, edgeIndex, edgeCount } = attrs as { type?: string; edgeIndex?: number; edgeCount?: number }
					const curvature = (
						typeof edgeIndex === 'number' && typeof edgeCount === 'number'
							? (edgeCount === 1 ? 0 : edgeIndex / (edgeCount - 1) * 2 - 1) * (1 - Math.exp(-0.1 * edgeCount))
							: 0
					)
					g.mergeEdgeAttributes(edge, {
						type: type?.replace(/^(?:curved|straight)/, curvature !== 0 ? 'curved' : 'straight') ?? 'curved',
						curvature,
					})
				})
			}
			renderer.setGraph(g)
			renderer.refresh()
		}

		$effect(() => {
			const g = graph
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
			const g = graph

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
							g.setNodeAttribute(node, 'x', attrs.x + (attrs.x / dist) * repelForce)
							g.setNodeAttribute(node, 'y', attrs.y + (attrs.y / dist) * repelForce)
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
		]).then(([sigmaMod, forceWorkerMod, sigmaRendering, nodeImageMod, edgeCurveMod, forceAtlas2Mod]) => {
			const SigmaClass = sigmaMod.default
			const ForceSupervisor = forceWorkerMod.default
			const forceAtlas2 = forceAtlas2Mod.default
			const nodeProgramClasses = {
				'circle': sigmaRendering.NodeCircleProgram,
				'point': sigmaRendering.NodePointProgram,
				'image': nodeImageMod.createNodeImageProgram({
					objectFit: 'contain',
					padding: 0.1,
					correctCentering: true,
				}),
				'pictogram': nodeImageMod.NodePictogramProgram,
			}

			modules = {
				EdgeCurveModule: edgeCurveMod,
				ForceSupervisor,
				forceAtlas2,
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
						'straight': sigmaRendering.EdgeLineProgram,
						'straightArrow': sigmaRendering.EdgeArrowProgram,
						'curved': edgeCurveMod.default,
						'curvedArrow': edgeCurveMod.EdgeCurvedArrowProgram,
					},
				},
			)

			applyGraph(graph)

			if (enableForce !== false) {
				layout = new ForceSupervisor(graph, {
					settings: {
						...forceAtlas2.inferSettings(graph),
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
					if (draggedNode) activeGraph.removeNodeAttribute(draggedNode, 'highlighted')
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
		})

		return () => {
			if (centerInterval) clearInterval(centerInterval)
			layout?.kill()
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


<!-- 
<script lang="ts">
	// Types
	import type Graph from 'graphology'
	import type { Attributes } from 'graphology-types'
	import type { DisplayData } from 'sigma/types'
	import type { Sigma } from 'sigma'
	import { browser } from '$app/environment'
	import { untrack } from 'svelte'


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


	// Derived: sigma modules (async load once in browser)
	const sigmaModulesPromise =
		browser
			? Promise.all([
				import('sigma'),
				import('graphology-layout-forceatlas2/worker'),
				import('sigma/rendering'),
				import('@sigma/node-image'),
				import('@sigma/edge-curve'),
				import('graphology-layout-forceatlas2'),
			])
			: null
	const sigmaModules = $derived(sigmaModulesPromise ? await sigmaModulesPromise : null)


	// Derived: highlighted set for center attraction
	const highlightedSet = $derived(new Set(highlightedNodes ?? []))


	// State: renderer created by attachment so effects can react to it
	let renderer = $state<Sigma | undefined>(undefined)
</script>


<div
	{@attach (container) => {
		let layout: import('graphology-layout-forceatlas2/worker').default | undefined
		let draggedNode: string | null = null
		let centerInterval: ReturnType<typeof setInterval> | undefined
		const cleanups: (() => void)[] = []

		// Init Sigma when modules and container are ready (untrack graph so graph changes don't recreate Sigma)
		$effect(() => {
			const mods = sigmaModules
			if (!mods || !container || !browser) return

			const g = untrack(() => graph)

			const [
				{ default: SigmaClass },
				{ default: ForceSupervisor },
				SigmaRenderingModule,
				NodeImageModule,
				EdgeCurveModule,
				{ default: forceAtlas2 },
			] = mods

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
				g,
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

			if (enableDragAndDrop !== false) {
				renderer.on('downNode', (e) => {
					draggedNode = e.node
					g.setNodeAttribute(draggedNode, 'highlighted', true)
				})

				const mouseCaptor = renderer.getMouseCaptor()

				mouseCaptor.on('mousemovebody', (e) => {
					if (!draggedNode || !renderer) return
					layout?.stop()
					const pos = renderer.viewportToGraph(e)
					g.setNodeAttribute(draggedNode, 'x', pos.x)
					g.setNodeAttribute(draggedNode, 'y', pos.y)
					e.preventSigmaDefault()
					e.original.preventDefault()
					e.original.stopPropagation()
				})

				mouseCaptor.on('mouseup', () => {
					if (draggedNode) g.removeNodeAttribute(draggedNode, 'highlighted')
					draggedNode = null
					layout?.start()
				})

				mouseCaptor.on('mousedown', () => {
					if (renderer && !renderer.getCustomBBox()) {
						renderer.setCustomBBox(renderer.getBBox())
					}
				})
			}

			if (enableForce !== false) {
				layout = new ForceSupervisor(g, {
					settings: {
						...forceAtlas2.inferSettings(g),
						adjustSizes: true,
						slowDown: 10,
					},
				})
				layout.start()
				cleanups.push(() => layout?.kill())
			}

			return () => {
				layout?.kill()
				layout = undefined
				renderer?.kill()
				renderer = undefined
			}
		})

		// Update graph (parallel edges, setGraph) when graph or refreshKey change
		$effect(() => {
			if (!renderer || !graph) return

			const [
				,
				,
				,
				,
				EdgeCurveModule,
			] = sigmaModules ?? []

			if (arrangeParallelEdges !== false && EdgeCurveModule) {
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
			}

			renderer.setGraph(graph)
			renderer.refresh()
		})

		// Reducers and refresh when reducers or renderer change
		$effect(() => {
			if (!renderer) return
			if (edgeReducer) renderer.setSetting('edgeReducer', edgeReducer)
			if (nodeReducer) renderer.setSetting('nodeReducer', nodeReducer)
			renderer.refresh()
		})

		// Center attraction when highlightedSet / centerForce / renderer change
		$effect(() => {
			if (!renderer) return

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

		return () => {
			if (centerInterval) clearInterval(centerInterval)
			cleanups.forEach((fn) => fn())
			renderer?.kill()
			renderer = undefined
		}
	}}
></div>


<style>
	div {
		width: 100%;
		height: 100%;
	}
</style>

-->
