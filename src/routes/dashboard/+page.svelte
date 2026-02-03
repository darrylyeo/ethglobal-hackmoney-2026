<script lang="ts">
	// Types/constants
	import type { DashboardNode, DashboardPanelRoute } from '$/data/DashboardPanel'

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { pushState } from '$app/navigation'
	import { resolve } from '$app/paths'
	import {
		dashboardPanelsCollection,
		dashboardStateId,
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

	// Context
	const dashboardQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardPanelsCollection })
				.where(({ row }) => eq(row.$id, dashboardStateId))
				.select(({ row }) => ({ row })),
	)

	// (Derived)
	const dashboardRow = $derived(
		(dashboardQuery.data ?? [])[0]?.row
		?? ensureDashboardState(defaultRoutePath),
	)
	const root = $derived(dashboardRow.root)
	const focusedPanelId = $derived(dashboardRow.focusedPanelId)
	const focusedPanel = $derived(getPanelById(root, focusedPanelId))
	const panelIds = $derived(listPanelIds(root))

	// Functions
	const isPrefix = (a: string[], b: string[]) => (
		a.every((value, index) => value === b[index])
	)

	// State
	let pushedPanelId = $state<string | null>(null)
	let pushedHashes = $state<string[]>([])

	// Actions
	const setRoot = (nextRoot: DashboardNode) => (
		setDashboardRoot(nextRoot)
	)

	const focusPanel = (panelId: string) => (
		setDashboardFocus(panelId)
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
					setDashboardFocus(firstPanelId(nextRoot))
				}
			})()
		)

	const swapPanel = (panelId: string) => (
		setRoot(swapWithSibling(root, panelId))
	)

	const updateSplitRatio = (splitId: string, ratio: number) => (
		setRoot(setSplitRatio(root, splitId, ratio))
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

	const appendPanelHash = (panelId: string, hash: string) => (
		setRoot(
			updatePanel(root, panelId, (panel) => ({
				...panel,
				hashHistory: [...panel.hashHistory, hash],
			})),
		)
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
		if (pushedHashes.length > 0 && shouldReplace) {
			history.go(-pushedHashes.length)
		}
		if (shouldReplace) {
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
	data-dashboard
	data-sticky-container
>
	<section data-scroll-item>
		<header data-dashboard-header>
			<h1>Dashboard</h1>
			<p>
				Focused panel hashes are mirrored into the URL history.
			</p>
		</header>
	</section>

	<section data-scroll-item data-dashboard-tree>
		<PanelTree
			{root}
			{focusedPanelId}
			onFocus={focusPanel}
			onSplit={splitFocusedPanel}
			onRemove={removePanelById}
			onSwap={swapPanel}
			onUpdateRoute={updatePanelRoute}
			onAppendHash={appendPanelHash}
			onSetSplitRatio={updateSplitRatio}
			onToggleSplitDirection={flipSplitDirection}
		/>
	</section>
</main>


<style>
	main[data-dashboard] {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		min-height: 70vh;
	}

	header[data-dashboard-header] {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	section[data-dashboard-tree] {
		flex: 1;
		min-height: 60vh;
	}
</style>
