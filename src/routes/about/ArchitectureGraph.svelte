<script lang="ts">
	// Types/constants
	import type { EdgeData, Graph as G6Graph, NodeData } from '@antv/g6'
	import type { ArchitectureEdge, ArchitectureNode } from './architecture-graph'
	import { ComboEvent, EdgeEvent, Graph, NodeEvent } from '@antv/g6'
	import { ForceLayout } from '@antv/layout'
	import { architectureGraph } from './architecture-graph'


	// Props
	let {
		height = '70vh',
	}: {
		height?: string
	} = $props()


	// Functions
	const isRecord = (value: unknown): value is Record<string, unknown> =>
		typeof value === 'object' && value !== null
	const getNumber = (value: unknown): number | null =>
		typeof value === 'number' ? value : null
	const getTargetId = (event: unknown) =>
		isRecord(event) &&
		isRecord(event.target) &&
		typeof event.target.id === 'string'
			? event.target.id
			: null
	const toGradient = (color: string) => `l(0) 0:${color} 1:#0f172a`
	const getThemeToken = (varName: string) =>
		typeof document !== 'undefined'
			? getComputedStyle(document.documentElement)
					.getPropertyValue(varName)
					.trim()
			: ''
	const toNodeStyle = (
		node: ArchitectureNode,
		prefersDark: boolean,
		theme: { text: string; bgSubtle: string },
	) => {
		const labelFill = theme.text || (prefersDark ? '#e2e8f0' : '#0f172a')
		const labelBackgroundFill = prefersDark
			? 'rgba(15, 23, 42, 0.92)'
			: 'rgba(255, 255, 255, 0.92)'
		const isPrimary = node.priority === 'primary'
		const isOptional = node.priority === 'optional'
		const isTestnet = node.layer === 'networks' && node.badge === 'Testnet'
		return {
			x: node.x,
			y: node.y,
			size: node.size,
			fill: isPrimary ? toGradient(node.color) : node.color,
			stroke: node.stroke ?? node.color,
			lineWidth: node.lineWidth ?? 1.5,
			lineDash: isTestnet ? [4, 4] : node.lineDash,
			opacity: node.opacity ?? (isOptional ? 0.7 : isTestnet ? 0.75 : 1),
			labelText: node.label,
			labelPlacement: node.layer === 'networks' ? 'bottom' : 'right',
			labelBackground: true,
			labelBackgroundFill,
			labelBackgroundRadius: 6,
			labelPadding: [2, 6],
			labelFill,
			labelFontSize: 11,
			labelMaxWidth: 140,
			labelWordWrap: true,
			badgeText: node.badge ?? '',
			badgeFill: prefersDark ? theme.text : theme.bgSubtle,
			badgeStroke: node.color,
			badgeLineWidth: 1,
			badgeTextFill: labelFill,
			badgeFontSize: 9,
			badgePadding: [2, 5],
			halo: isPrimary,
			haloLineWidth: isPrimary ? 8 : 4,
			haloStroke: node.color,
			haloStrokeOpacity: isPrimary ? 0.3 : 0.18,
			shadowBlur: isOptional ? 0 : 8,
			shadowColor: 'rgba(15, 23, 42, 0.25)',
			zIndex: node.zIndex ?? (isPrimary ? 5 : 3),
			iconSrc: node.icon,
			iconRadius: node.icon ? node.size * 0.35 : undefined,
			iconOpacity: node.icon ? 1 : undefined,
			anchorPoints: [
				[0, 0.5],
				[1, 0.5],
			],
		}
	}
	const toNodeData = (
		node: ArchitectureNode,
		prefersDark: boolean,
		theme: { text: string; bgSubtle: string },
	): NodeData => {
		const data = {
			label: node.label,
			layer: node.layer,
			priority: node.priority ?? 'secondary',
			details: node.details,
		}
		const style = toNodeStyle(node, prefersDark, theme)
		return {
			id: node.id,
			type: node.shape === 'image' ? 'image' : node.shape,
			combo: node.combo,
			data,
			ports: [
				{ key: 'in', x: 0, y: 0.5 },
				{ key: 'out', x: 1, y: 0.5 },
			],
			style:
				node.shape === 'image' && node.icon
					? { ...style, src: node.icon }
					: style,
		}
	}
	const toEdgeStyle = (
		edge: ArchitectureEdge,
		prefersDark: boolean,
		theme: { text: string; bgSubtle: string },
	) => {
		const labelFill = theme.text || (prefersDark ? '#e2e8f0' : '#0f172a')
		const labelBackgroundFill = prefersDark
			? 'rgba(15, 23, 42, 0.9)'
			: 'rgba(255, 255, 255, 0.9)'
		const isPrimary = edge.priority === 'primary'
		return {
			stroke: isPrimary ? toGradient(edge.color) : edge.color,
			lineWidth: edge.lineWidth,
			lineDash: edge.lineDash,
			opacity: edge.opacity ?? (edge.priority === 'optional' ? 0.5 : 0.85),
			labelText: edge.label,
			labelBackground: true,
			labelBackgroundFill,
			labelBackgroundRadius: 5,
			labelPadding: [2, 6],
			labelFill,
			labelFontSize: 9,
			labelAutoRotate: true,
			labelPlacement: 'center',
			endArrow: true,
			startArrow: edge.bidirectional ?? false,
			shadowBlur: isPrimary ? 6 : 2,
			shadowColor: 'rgba(15, 23, 42, 0.18)',
			zIndex: isPrimary ? 4 : 2,
			controlPoints: edge.controlPoints,
		}
	}
	const toEdgeData = (
		edge: ArchitectureEdge,
		prefersDark: boolean,
		theme: { text: string; bgSubtle: string },
	): EdgeData => ({
		id: edge.id,
		source: edge.source,
		target: edge.target,
		type: edge.type,
		data: {
			label: edge.label,
			relation: edge.relation,
			priority: edge.priority ?? 'secondary',
		},
		style: toEdgeStyle(edge, prefersDark, theme),
	})
	const toSelectionLabel = (selection: {
		nodes: NodeData[]
		edges: EdgeData[]
		combos: { id: string }[]
	}) =>
		selection.nodes.length > 0
			? selection.nodes.map((node) => node.data?.label ?? node.id).join(', ')
			: selection.edges.length > 0
				? selection.edges.map((edge) => edge.data?.label ?? edge.id).join(', ')
				: selection.combos.length > 0
					? selection.combos.map((combo) => combo.id).join(', ')
					: 'No selection'
	const nodeById = new Map(
		architectureGraph.nodes.map((node) => [node.id, node]),
	)
	const edgeById = new Map(
		architectureGraph.edges.map((edge) => [edge.id, edge]),
	)
	const comboById = new Map(
		architectureGraph.combos.map((combo) => [combo.id, combo]),
	)


	// State
	let hoveredItem = $state<{
		kind: 'node' | 'edge' | 'combo'
		label: string
		details?: Record<string, string>
		relation?: string
		priority?: string
	} | null>(null)
	let selectedItem = $state<{
		kind: 'node' | 'edge' | 'combo'
		label: string
		details?: Record<string, string>
		relation?: string
		priority?: string
	} | null>(null)
	let selectionSummary = $state('No selection')


	// (Derived)
	const selectionAnnouncement = $derived(
		selectedItem
			? `Selected ${selectedItem.kind}: ${selectedItem.label}`
			: 'Selection cleared',
	)
</script>


<svelte:boundary>
	<div class="architecture-graph" style:height>
		<div
			class="architecture-graph__canvas"
			role="application"
			tabindex="0"
			aria-label="Architecture graph with selectable systems and flows"
			{@attach (container) => {
				let graph: G6Graph | undefined
				let resizeObserver: ResizeObserver | undefined
				const reducedMotion = window.matchMedia(
					'(prefers-reduced-motion: reduce)',
				).matches
				const prefersDark = window.matchMedia(
					'(prefers-color-scheme: dark)',
				).matches
				const theme = {
					text: getThemeToken('--color-text'),
					bgSubtle: getThemeToken('--color-bg-subtle'),
				}
				const { width, height } = container.getBoundingClientRect()

				const comboIds = new Set(
					architectureGraph.combos.map((combo) => combo.id),
				)
				const comboTargets = new Set(
					architectureGraph.edges
						.flatMap((edge) => [edge.source, edge.target])
						.filter((id) => comboIds.has(id)),
				)
				const comboAnchorIds = new Map(
					Array.from(comboTargets, (comboId) => [
						comboId,
						`combo-anchor-${comboId}`,
					]),
				)
				const nodesByCombo = new Map(
					architectureGraph.combos.map((combo) => [
						combo.id,
						architectureGraph.nodes.filter((node) => node.combo === combo.id),
					]),
				)
				const comboAnchors = Array.from(comboAnchorIds.entries()).map(
					([comboId, anchorId]) => {
						const nodes = nodesByCombo.get(comboId) ?? []
						const x =
							nodes.reduce((sum, node) => sum + node.x, 0) /
							Math.max(nodes.length, 1)
						const y =
							nodes.reduce((sum, node) => sum + node.y, 0) /
							Math.max(nodes.length, 1)
						return {
							id: anchorId,
							type: 'circle',
							combo: comboId,
							data: {
								label: '',
								layer: 'state',
								priority: 'optional',
								details: {},
							},
							style: {
								x,
								y,
								size: 6,
								fill: 'transparent',
								stroke: 'transparent',
								labelText: '',
								opacity: 0,
							},
						}
					},
				)
				const resolveEndpoint = (id: string) => comboAnchorIds.get(id) ?? id

				const getLayoutSize = (node: unknown) =>
					isRecord(node) &&
					'style' in node &&
					isRecord(node.style) &&
					'size' in node.style
						? (getNumber(node.style.size) ?? 28)
						: 28

				graph = new Graph({
					container,
					width,
					height,
					autoFit: 'center',
					data: {
						nodes: [
							...architectureGraph.nodes.map((node) =>
								toNodeData(node, prefersDark, theme),
							),
							...comboAnchors,
						],
						edges: architectureGraph.edges.map((edge) =>
							toEdgeData(
								{
									...edge,
									source: resolveEndpoint(edge.source),
									target: resolveEndpoint(edge.target),
								},
								prefersDark,
								theme,
							),
						),
						combos: architectureGraph.combos.map((combo) => ({
							id: combo.id,
							type: 'rect',
							data: { label: combo.label },
							style: {
								fill: combo.color,
								fillOpacity: prefersDark ? 0.08 : 0.12,
								stroke: combo.color,
								strokeOpacity: 0.4,
								lineWidth: 1,
								lineDash: [4, 4],
								labelText: combo.label,
								labelPlacement: 'top',
								labelBackground: true,
								labelBackgroundFill: prefersDark
									? 'rgba(15, 23, 42, 0.92)'
									: 'rgba(255, 255, 255, 0.92)',
								labelBackgroundRadius: 6,
								labelPadding: [2, 6],
								labelFill: theme.text || (prefersDark ? '#e2e8f0' : '#0f172a'),
								labelFontSize: 11,
								zIndex: 0,
							},
						})),
					},
					layout: {
						type: 'combo-combined',
						animation: !reducedMotion,
						comboPadding: 28,
						spacing: 24,
						nodeSize: getLayoutSize,
						outerLayout: new ForceLayout({
							preventOverlap: true,
							nodeSpacing: 18,
							nodeSize: getLayoutSize,
							nodeStrength: -220,
							edgeStrength: 0.15,
							gravity: 0.1,
							damping: 0.9,
						}),
					},
					node: {
						state: {
							selected: {
								lineWidth: 2.5,
								halo: true,
								haloLineWidth: 10,
								haloStroke: '#60a5fa',
								haloStrokeOpacity: 0.35,
							},
							hover: {
								lineWidth: 2.5,
								halo: true,
								haloLineWidth: 8,
								haloStroke: '#38bdf8',
								haloStrokeOpacity: 0.25,
							},
							active: {
								lineWidth: 2.5,
								halo: true,
								haloLineWidth: 8,
								haloStroke: '#38bdf8',
								haloStrokeOpacity: 0.35,
							},
							disabled: {
								opacity: 0.35,
							},
						},
						animation: reducedMotion
							? false
							: {
									update: [
										{
											fields: ['x', 'y'],
											duration: 240,
										},
									],
								},
					},
					edge: {
						state: {
							selected: {
								lineWidth: 2.5,
								halo: true,
								haloLineWidth: 7,
								haloStroke: '#60a5fa',
								haloStrokeOpacity: 0.35,
							},
							hover: {
								lineWidth: 2,
								halo: true,
								haloLineWidth: 6,
								haloStroke: '#38bdf8',
								haloStrokeOpacity: 0.25,
							},
							active: {
								lineWidth: 2,
								halo: true,
								haloLineWidth: 6,
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
											duration: 240,
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
								strokeOpacity: 0.55,
							},
						},
						animation: reducedMotion
							? false
							: {
									update: [
										{
											fields: ['x', 'y', 'width', 'height'],
											duration: 240,
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
							enableElements: ['node', 'edge', 'combo'],
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
									.map(
										([key, value]) =>
											`<div><strong>${key}:</strong> ${String(value)}</div>`,
									)
									.join('')
								return `
									<div>
										<strong>${item.data?.label ?? item.id}</strong>
										${detailsMarkup}
									</div>
								`
							},
						},
						{
							type: 'minimap',
						},
					],
				})

				const updateSelection = () => {
					if (!graph) return
					const nodes = graph.getElementDataByState('node', 'selected')
					const edges = graph.getElementDataByState('edge', 'selected')
					const combos = graph.getElementDataByState('combo', 'selected')
					selectionSummary = toSelectionLabel({
						nodes,
						edges,
						combos,
					})
					const node = nodes[0]
					const edge = edges[0]
					const combo = combos[0]
					const nodeEntry = node ? nodeById.get(node.id) : undefined
					const edgeEntry = edge ? edgeById.get(edge.id) : undefined
					const comboEntry = combo ? comboById.get(combo.id) : undefined
					selectedItem = node
						? {
								kind: 'node',
								label: nodeEntry?.label ?? node.id,
								details: nodeEntry?.details,
								priority: nodeEntry?.priority,
							}
						: edge
							? {
									kind: 'edge',
									label: edgeEntry?.label ?? edge.id,
									relation: edgeEntry?.relation,
									priority: edgeEntry?.priority,
								}
							: combo
								? {
										kind: 'combo',
										label: comboEntry?.label ?? combo.id,
									}
								: null
				}

				const setHoverItem = (
					item: NodeData | EdgeData | null,
					kind: 'node' | 'edge',
				) => {
					hoveredItem = item
						? {
								kind,
								label: String(item.data?.label ?? item.id),
								details: toDetails(item.data?.details),
								relation: toStringValue(item.data?.relation),
								priority: toStringValue(item.data?.priority),
							}
						: null
				}

				graph.render()

				graph.on(NodeEvent.CLICK, () => updateSelection())
				graph.on(EdgeEvent.CLICK, () => updateSelection())
				graph.on(ComboEvent.CLICK, () => updateSelection())
				graph.on(NodeEvent.POINTER_OVER, (event) => {
					const targetId = getTargetId(event)
					if (!targetId) return
					const node = nodeById.get(targetId)
					hoveredItem = node
						? {
								kind: 'node',
								label: node.label,
								details: node.details,
								priority: node.priority,
							}
						: null
				})
				graph.on(NodeEvent.POINTER_OUT, () => {
					hoveredItem = null
				})
				graph.on(EdgeEvent.POINTER_OVER, (event) => {
					const targetId = getTargetId(event)
					if (!targetId) return
					const edge = edgeById.get(targetId)
					hoveredItem = edge
						? {
								kind: 'edge',
								label: edge.label,
								relation: edge.relation,
								priority: edge.priority,
							}
						: null
				})
				graph.on(EdgeEvent.POINTER_OUT, () => {
					hoveredItem = null
				})

				const handleKeydown = (event: KeyboardEvent) => {
					if (event.key === 'Escape') {
						selectedItem = null
						selectionSummary = 'No selection'
						graph?.clearElementState('node', 'selected')
						graph?.clearElementState('edge', 'selected')
						graph?.clearElementState('combo', 'selected')
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

				return () => {
					container.removeEventListener('keydown', handleKeydown)
					resizeObserver?.disconnect()
					graph?.destroy()
					graph = undefined
				}
			}}
		></div>

		<aside
			class="architecture-graph__details"
			data-column="gap-2"
			aria-live="polite"
		>
			<h3>Details</h3>
			<p class="architecture-graph__selection">{selectionSummary}</p>
			{#if hoveredItem}
				<p class="architecture-graph__detail-title">Hover</p>
				<p>{hoveredItem.label}</p>
				{#if hoveredItem.relation}
					<p class="architecture-graph__detail-meta">
						Relation: {hoveredItem.relation}
					</p>
				{/if}
				{#if hoveredItem.details}
					<dl>
						{#each Object.entries(hoveredItem.details) as [key, value] (key)}
							<div class="architecture-graph__detail-row">
								<dt>{key}</dt>
								<dd>{value}</dd>
							</div>
						{/each}
					</dl>
				{/if}
			{:else if selectedItem}
				<p class="architecture-graph__detail-title">Selected</p>
				<p>{selectedItem.label}</p>
				{#if selectedItem.relation}
					<p class="architecture-graph__detail-meta">
						Relation: {selectedItem.relation}
					</p>
				{/if}
				{#if selectedItem.details}
					<dl>
						{#each Object.entries(selectedItem.details) as [key, value] (key)}
							<div class="architecture-graph__detail-row">
								<dt>{key}</dt>
								<dd>{value}</dd>
							</div>
						{/each}
					</dl>
				{/if}
			{:else}
				<p class="architecture-graph__detail-meta">
					Hover or select a node or edge to view metadata.
				</p>
			{/if}
		</aside>
	</div>

	{#snippet Error(error, reset)}
		<div data-card>
			<h3>Architecture graph error</h3>
			<p>{error instanceof Error ? error.message : String(error)}</p>
			<button type="button" onclick={reset}>Retry</button>
		</div>
	{/snippet}
</svelte:boundary>

<div class="sr-only" aria-live="polite">
	{selectionAnnouncement}
</div>


<style>
	.architecture-graph {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: minmax(0, 1fr) minmax(14rem, 18rem);
		align-items: stretch;
	}

	.architecture-graph__canvas {
		border-radius: 1rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-subtle);
		box-shadow: var(--shadow-lg);
		min-height: 24rem;
		touch-action: none;
		overscroll-behavior: contain;
	}

	.architecture-graph__details {
		border-radius: 1rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-page);
		padding: 1rem;
	}

	.architecture-graph__selection {
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.architecture-graph__detail-title {
		font-weight: 600;
		margin-top: 0.5rem;
	}

	.architecture-graph__detail-meta {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.architecture-graph__detail-row {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem;
		font-size: 0.85rem;
		margin-top: 0.35rem;
	}

	.architecture-graph__detail-row dt {
		font-weight: 600;
		color: var(--color-text);
	}

	.architecture-graph__detail-row dd {
		margin: 0;
		color: var(--color-text-muted);
	}

	@media (max-width: 900px) {
		.architecture-graph {
			grid-template-columns: 1fr;
		}
	}
</style>
