<script lang="ts">
	// Types/constants
	import type {
		DashboardNode,
		DashboardPanelNode,
		DashboardPanelRoute,
		DashboardSplitNode,
	} from '$/data/DashboardPanel.ts'
	import { SplitDirection } from '$/data/PanelTree.ts'

	import { untrack } from 'svelte'
	import { and, eq, not, useLiveQuery } from '@tanstack/svelte-db'
	import { browser } from '$app/environment'
	import { pushState, replaceState } from '$app/navigation'
	import { resolve } from '$app/paths'
	import {
		dashboardsCollection,
		ensureFarcasterDashboardState,
		setDashboardFocus,
		setDashboardRoot,
	} from '$/collections/Dashboards.ts'


	// Functions
	import { parseSessionStateFromHashLike } from '$/lib/session/sessions.ts'
	import { buildRoutePath } from '$/routes/dashboard/route-map.ts'


	// Components
	import PanelTree from '$/routes/dashboard/PanelTree.svelte'


	const FARCASTER_DASHBOARD_ID = 'farcaster'
	const defaultRoute: DashboardPanelRoute = {
		path: '/farcaster/casts',
		params: {},
	}

	const createPanelNode = (
		route: DashboardPanelRoute,
		hashHistory: string[] = [],
	): DashboardPanelNode => ({
		id: crypto.randomUUID(),
		type: 'panel',
		route,
		hashHistory,
	})

	const getPanelById = (
		node: DashboardNode,
		panelId: string,
	): DashboardPanelNode | null =>
		node.type === 'panel'
			? node.id === panelId
				? node
				: null
			: (getPanelById(node.first, panelId) ??
				getPanelById(node.second, panelId))

	const updateNode = (
		node: DashboardNode,
		apply: (target: DashboardNode) => DashboardNode | null,
	): DashboardNode =>
		apply(node) ??
		(node.type === 'split'
			? (() => {
					const first: DashboardNode = updateNode(node.first, apply)
					const second: DashboardNode = updateNode(node.second, apply)
					return first === node.first && second === node.second
						? node
						: { ...node, first, second }
				})()
			: node)

	const updatePanel = (
		root: DashboardNode,
		panelId: string,
		update: (panel: DashboardPanelNode) => DashboardPanelNode,
	) =>
		updateNode(root, (node) =>
			node.type === 'panel' && node.id === panelId ? update(node) : null,
		)

	const splitPanel = (
		root: DashboardNode,
		panelId: string,
		direction: DashboardSplitNode['direction'],
		createRoute: () => DashboardPanelRoute,
		createHashHistory: () => string[] = () => [],
	) =>
		updateNode(root, (node) =>
			node.type === 'panel' && node.id === panelId
				? {
						id: crypto.randomUUID(),
						type: 'split',
						direction,
						ratio: 0.5,
						first: node,
						second: createPanelNode(createRoute(), createHashHistory()),
					}
				: null,
		)

	const swapWithSibling = (root: DashboardNode, panelId: string) =>
		updateNode(root, (node) =>
			node.type === 'split'
				? (node.first.type === 'panel' && node.first.id === panelId) ||
					(node.second.type === 'panel' && node.second.id === panelId)
					? { ...node, first: node.second, second: node.first }
					: null
				: null,
		)

	const setSplitRatio = (root: DashboardNode, splitId: string, ratio: number) =>
		updateNode(root, (node) =>
			node.type === 'split' && node.id === splitId ? { ...node, ratio } : null,
		)

	const toggleSplitDirection = (root: DashboardNode, splitId: string) =>
		updateNode(root, (node) =>
			node.type === 'split' && node.id === splitId
				? {
						...node,
						direction:
							node.direction === SplitDirection.Horizontal
							? SplitDirection.Vertical
							: SplitDirection.Horizontal,
					}
				: null,
		)

	const removePanel = (root: DashboardNode, panelId: string) => {
		const removeResult = (node: DashboardNode): DashboardNode | null =>
			node.type === 'panel'
				? node.id === panelId
					? null
					: node
				: (() => {
						const first = removeResult(node.first)
						const second = first ? removeResult(node.second) : null
						return !first
							? node.second
							: !second
								? node.first
								: first === node.first && second === node.second
									? node
									: { ...node, first, second }
					})()
		return removeResult(root)
	}

	const firstPanelId = (node: DashboardNode): string =>
		node.type === 'panel' ? node.id : firstPanelId(node.first)

	const listPanelIds = (node: DashboardNode): string[] =>
		node.type === 'panel'
			? [node.id]
			: [...listPanelIds(node.first), ...listPanelIds(node.second)]


	// State
	const dashboardRowQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardsCollection })
				.where(({ row }) =>
					and(
						not(eq(row.$id.id, '__default__')),
						eq(row.$id.id, FARCASTER_DASHBOARD_ID),
					),
				)
				.select(({ row }) => ({ row })),
		[],
	)
	$effect(() => {
		const dashboard = dashboardRowQuery.data?.[0]?.row
		if (!dashboard) ensureFarcasterDashboardState()
	})
	const dashboardRow = $derived(
		dashboardRowQuery.data?.[0]?.row
	)
	const root = $derived(
		dashboardRow && 'root' in dashboardRow ? dashboardRow.root : undefined,
	)
	const focusedPanelId = $derived(
		dashboardRow && 'focusedPanelId' in dashboardRow
			? dashboardRow.focusedPanelId
			: '',
	)

	const focusedPanel = $derived(
		root ? getPanelById(root, focusedPanelId) : null,
	)
	const panelIds = $derived(
		root ? listPanelIds(root) : []
	)

	const isPrefix = (a: string[], b: string[]) =>
		a.every((value, index) => value === b[index])
	const isSameRoute = (a: DashboardPanelRoute, b: DashboardPanelRoute) =>
		a.path === b.path &&
		Object.keys(a.params).length === Object.keys(b.params).length &&
		Object.entries(a.params).every(([key, value]) => b.params[key] === value)

	let pushedPanelId = $state<string | null>(null)
	let pushedHashes = $state<string[]>([])


	// Actions
	const setRoot = (nextRoot: DashboardNode) =>
		setDashboardRoot(FARCASTER_DASHBOARD_ID, nextRoot)
	const focusPanel = (panelId: string) =>
		setDashboardFocus(FARCASTER_DASHBOARD_ID, panelId)

	const splitFocusedPanel = (
		panelId: string,
		direction: SplitDirection,
	) => {
		if (!root) return
		setRoot(
			splitPanel(root, panelId, direction, () => defaultRoute),
		)
	}

	const removePanelById = (panelId: string) => {
		if (!root) return
		const nextRoot = removePanel(root, panelId) ?? root
		setRoot(nextRoot)
		if (focusedPanelId === panelId) focusPanel(firstPanelId(nextRoot))
	}

	const swapPanel = (panelId: string) => {
		if (!root) return
		setRoot(swapWithSibling(root, panelId))
	}

	const RATIO_MIN = 0.2
	const RATIO_MAX = 0.8

	let splitRatioOverrides = $state<Record<string, number>>({})
	const setSplitRatioOverride = (splitId: string, value: number) =>
		(splitRatioOverrides = { ...splitRatioOverrides, [splitId]: value })
	const clearSplitRatioOverride = (splitId: string) =>
		(() => {
			const next = { ...splitRatioOverrides }
			delete next[splitId]
			splitRatioOverrides = next
		})()

	const updateSplitRatio = (splitId: string, ratio: number) => {
		if (!root) return
		setRoot(
			setSplitRatio(
				root,
				splitId,
				Math.max(RATIO_MIN, Math.min(RATIO_MAX, ratio)),
			),
		)
	}

	const flipSplitDirection = (splitId: string) => {
		if (!root) return
		setRoot(toggleSplitDirection(root, splitId))
	}

	const updatePanelRoute = (panelId: string, route: DashboardPanelRoute) => {
		if (!root) return
		setRoot(
			updatePanel(root, panelId, (panel) => ({
				...panel,
				route,
				hashHistory: [],
			})),
		)
	}

	const navigatePanel = (
		panelId: string,
		route: DashboardPanelRoute,
		hash: string | null,
	) => {
		if (!root) return
		setRoot(
			updatePanel(root, panelId, (panel) =>
				isSameRoute(panel.route, route)
					? hash
						? { ...panel, hashHistory: [...panel.hashHistory, hash] }
						: panel
					: { ...panel, route, hashHistory: hash ? [hash] : [] },
			),
		)
	}

	const appendPanelHash = (panelId: string, hash: string) => {
		if (!root) return
		setRoot(
			updatePanel(root, panelId, (panel) => ({
				...panel,
				hashHistory: [...panel.hashHistory, hash],
			})),
		)
	}

	const setPanelHash = (panelId: string, hash: string, replace = true) => {
		if (!root) return
		setRoot(
			updatePanel(root, panelId, (panel) => ({
				...panel,
				hashHistory: replace ? [hash] : [...panel.hashHistory, hash],
			})),
		)
	}

	const openInNewPanel = (
		panelId: string,
		route: DashboardPanelRoute,
		hash: string | null,
	) => {
		if (!root) return
		const beforeIds = listPanelIds(root)
		const nextRoot = splitPanel(root, panelId, SplitDirection.Horizontal, () => route, () =>
			hash ? [hash] : [],
		)
		setRoot(nextRoot)
		focusPanel(
			listPanelIds(nextRoot).find((id) => !beforeIds.includes(id)) ?? panelId,
		)
	}

	$effect(() => {
		if (!dashboardRow || panelIds.length === 0) return
		if (panelIds.includes(focusedPanelId)) return
		setDashboardFocus(FARCASTER_DASHBOARD_ID, panelIds[0])
	})

	$effect(() => {
		if (!browser || !dashboardRow || !focusedPanel) return
		const nextHashes = focusedPanel.hashHistory
		const { previousPanelId, previousHashes } = untrack(() => ({
			previousPanelId: pushedPanelId,
			previousHashes: pushedHashes,
		}))
		const baseUrl = resolve('/farcaster')
		const baseState = {
			panelId: focusedPanel.id,
			route: buildRoutePath(focusedPanel.route),
		}
		const shouldReplace =
			previousPanelId !== focusedPanel.id ||
			!isPrefix(previousHashes, nextHashes)
		const run = () => {
			if (shouldReplace) {
				replaceState(baseUrl, baseState)
				for (const hash of nextHashes) {
					pushState(baseUrl, {
						...baseState,
						sessionState: parseSessionStateFromHashLike(hash),
					})
				}
				pushedPanelId = focusedPanel.id
				pushedHashes = [...nextHashes]
				return
			}
			const newHashes = nextHashes.slice(previousHashes.length)
			for (const hash of newHashes) {
				pushState(baseUrl, {
					...baseState,
					sessionState: parseSessionStateFromHashLike(hash),
				})
			}
			if (newHashes.length > 0) pushedHashes = [...nextHashes]
		}
		setTimeout(run, 0)
	})
</script>

{#if dashboardRow && 'root' in dashboardRow}
	<section
		class="farcaster-dashboard-tree"
		data-scroll-item
	>
		<PanelTree
			root={dashboardRow.root}
			focusedPanelId={dashboardRow.focusedPanelId}
			excludeRoutePaths={['/farcaster']}
			{splitRatioOverrides}
			onFocus={focusPanel}
			onSplit={splitFocusedPanel}
			onRemove={removePanelById}
			onSwap={swapPanel}
			onUpdateRoute={updatePanelRoute}
			onAppendHash={appendPanelHash}
			onSetPanelHash={setPanelHash}
			onNavigate={navigatePanel}
			onOpenInNewPanel={openInNewPanel}
			onSetSplitRatio={updateSplitRatio}
			onSetSplitRatioOverride={setSplitRatioOverride}
			onClearSplitRatioOverride={clearSplitRatioOverride}
			onToggleSplitDirection={flipSplitDirection}
		/>
	</section>
{:else}
	<p>Loading…</p>
{/if}

<style>
	.farcaster-dashboard-tree {
		flex: 1 1 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
</style>
