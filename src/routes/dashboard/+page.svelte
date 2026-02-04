<script lang="ts">
	// Types/constants
	import type { DashboardNode, DashboardPanelRoute } from '$/data/DashboardPanel'

	import { pushState, replaceState } from '$app/navigation'
	import { resolve } from '$app/paths'
	import {
		ensureDashboardState,
		setDashboardFocus,
		setDashboardRoot,
	} from '$/collections/dashboard-panels'

	// Functions
	import {
		buildRoutePath,
		defaultRoutePath,
	} from './route-map'
	import {
		firstPanelId,
		getPanelById,
		listPanelIds,
		removePanel,
		setSplitRatio,
		splitPanel,
		swapWithSibling,
		toggleSplitDirection,
		updatePanel,
	} from './panel-tree'

	// Components
	import PanelTree from './PanelTree.svelte'

	// State
	const initialState = ensureDashboardState(defaultRoutePath)
	let root = $state(initialState.root)
	let focusedPanelId = $state(initialState.focusedPanelId)

	// (Derived)
	const focusedPanel = $derived(getPanelById(root, focusedPanelId))
	const panelIds = $derived(listPanelIds(root))

	// Functions
	const isPrefix = (a: string[], b: string[]) => (
		a.every((value, index) => value === b[index])
	)
	const isSameRoute = (
		a: DashboardPanelRoute,
		b: DashboardPanelRoute,
	) => (
		a.path === b.path
		&& Object.keys(a.params).length === Object.keys(b.params).length
		&& Object.entries(a.params).every(([key, value]) => b.params[key] === value)
	)

	let pushedPanelId = $state<string | null>(null)
	let pushedHashes = $state<string[]>([])

	// Actions
	const setRoot = (nextRoot: DashboardNode) => (
		(root = nextRoot, setDashboardRoot(nextRoot))
	)

	const focusPanel = (panelId: string) => (
		(focusedPanelId = panelId, setDashboardFocus(panelId))
	)

	const splitFocusedPanel = (
		panelId: string,
		direction: 'horizontal' | 'vertical',
	) => (
		setRoot(
			splitPanel(root, panelId, direction, () => ({
				path: defaultRoutePath,
				params: {},
			})),
		)
	)

	const removePanelById = (panelId: string) =>
		(
			(() => {
				const nextRoot = removePanel(root, panelId) ?? root
				setRoot(nextRoot)
				if (focusedPanelId === panelId) {
					focusPanel(firstPanelId(nextRoot))
				}
			})()
		)

	const swapPanel = (panelId: string) => (
		setRoot(swapWithSibling(root, panelId))
	)

	const RATIO_MIN = 0.2
	const RATIO_MAX = 0.8

	let splitRatioOverrides = $state<Record<string, number>>({})

	const setSplitRatioOverride = (splitId: string, value: number) => (
		(splitRatioOverrides = { ...splitRatioOverrides, [splitId]: value })
	)
	const clearSplitRatioOverride = (splitId: string) => (
		(() => {
			const next = { ...splitRatioOverrides }
			delete next[splitId]
			splitRatioOverrides = next
		})()
	)

	const updateSplitRatio = (splitId: string, ratio: number) => (
		setRoot(
			setSplitRatio(
				root,
				splitId,
				Math.max(RATIO_MIN, Math.min(RATIO_MAX, ratio)),
			),
		)
	)

	const flipSplitDirection = (splitId: string) => (
		setRoot(toggleSplitDirection(root, splitId))
	)

	const updatePanelRoute = (panelId: string, route: DashboardPanelRoute) => (
		setRoot(
			updatePanel(root, panelId, (panel) => ({
				...panel,
				route,
				hashHistory: [],
			})),
		)
	)

	const navigatePanel = (
		panelId: string,
		route: DashboardPanelRoute,
		hash: string | null,
	) => (
		setRoot(
			updatePanel(root, panelId, (panel) =>
				isSameRoute(panel.route, route) ?
					(
						hash ?
							{
								...panel,
								hashHistory: [...panel.hashHistory, hash],
							}
						:
							panel
					)
				:
					{
						...panel,
						route,
						hashHistory: hash ? [hash] : [],
					},
			),
		)
	)

	const appendPanelHash = (panelId: string, hash: string) => (
		setRoot(
			updatePanel(root, panelId, (panel) => ({
				...panel,
				hashHistory: [...panel.hashHistory, hash],
			})),
		)
	)

	const openInNewPanel = (
		panelId: string,
		route: DashboardPanelRoute,
		hash: string | null,
	) =>
		(
			(() => {
				const beforeIds = listPanelIds(root)
				const nextRoot = splitPanel(
					root,
					panelId,
					'horizontal',
					() => route,
					() => (hash ? [hash] : []),
				)
				setRoot(nextRoot)
				focusPanel(
					listPanelIds(nextRoot).find((id) => !beforeIds.includes(id))
					?? panelId,
				)
			})()
		)

	$effect(() => {
		if (panelIds.length === 0) return
		if (panelIds.includes(focusedPanelId)) return
		setDashboardFocus(panelIds[0])
	})

	$effect(() => {
		if (!focusedPanel) return
		const nextHashes = focusedPanel.hashHistory
		const shouldReplace =
			pushedPanelId !== focusedPanel.id
			|| !isPrefix(pushedHashes, nextHashes)
		if (shouldReplace) {
			replaceState(resolve('/dashboard'), {
				panelId: focusedPanel.id,
				hash: null,
				route: buildRoutePath(focusedPanel.route),
			})
			for (const hash of nextHashes) {
				pushState(resolve(`/dashboard${hash}`), {
					panelId: focusedPanel.id,
					hash,
					route: buildRoutePath(focusedPanel.route),
				})
			}
			pushedPanelId = focusedPanel.id
			pushedHashes = [...nextHashes]
			return
		}
		const newHashes = nextHashes.slice(pushedHashes.length)
		for (const hash of newHashes) {
			pushState(resolve(`/dashboard${hash}`), {
				panelId: focusedPanel.id,
				hash,
				route: buildRoutePath(focusedPanel.route),
			})
		}
		if (newHashes.length > 0) {
			pushedHashes = [...nextHashes]
		}
	})
</script>


<svelte:head>
	<title>Dashboard</title>
</svelte:head>


<main
	id="main"
	class="dashboard"
	data-sticky-container
>
	<section
		data-scroll-item
		class="dashboard-tree"
	>
		<PanelTree
			{root}
			{focusedPanelId}
			{splitRatioOverrides}
			onFocus={focusPanel}
			onSplit={splitFocusedPanel}
			onRemove={removePanelById}
			onSwap={swapPanel}
			onUpdateRoute={updatePanelRoute}
			onAppendHash={appendPanelHash}
			onNavigate={navigatePanel}
			onOpenInNewPanel={openInNewPanel}
			onSetSplitRatio={updateSplitRatio}
			onSetSplitRatioOverride={setSplitRatioOverride}
			onClearSplitRatioOverride={clearSplitRatioOverride}
			onToggleSplitDirection={flipSplitDirection}
		/>
	</section>
</main>


<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		height: 100vh;
		min-height: 0;
	}

	.dashboard-tree {
		flex: 1 1 0;
		min-height: 0;
	}
</style>
