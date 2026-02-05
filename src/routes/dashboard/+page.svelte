<script lang="ts">
	// Types/constants
	import type {
		DashboardNode,
		DashboardPanelNode,
		DashboardPanelRoute,
		DashboardSplitNode,
	} from '$/data/DashboardPanel'

	import { untrack } from 'svelte'
	import { pushState, replaceState } from '$app/navigation'
	import { resolve } from '$app/paths'
	import {
		ensureDashboardState,
		setDashboardFocus,
		setDashboardRoot,
	} from '$/collections/dashboard-panels'
	import { setIntentNavigateTo } from '$/state/intent-navigation.svelte'


	// Functions
	import { buildRoutePath, defaultRoutePath, routeEntries } from './route-map'


	// Components
	import PanelTree from './PanelTree.svelte'


	// Props
	let {
		data = {},
	}: {
		data?: Record<string, unknown>
	} = $props()

	const embeddedInPanel = $derived(data?.embeddedInPanel === true)
	const panelRouteLinks = $derived(
		routeEntries.filter((entry) => entry.path !== '/dashboard'),
	)

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
						: {
								...node,
								first,
								second,
							}
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
					? {
							...node,
							first: node.second,
							second: node.first,
						}
					: null
				: null,
		)

	const setSplitRatio = (root: DashboardNode, splitId: string, ratio: number) =>
		updateNode(root, (node) =>
			node.type === 'split' && node.id === splitId
				? {
						...node,
						ratio,
					}
				: null,
		)

	const toggleSplitDirection = (root: DashboardNode, splitId: string) =>
		updateNode(root, (node) =>
			node.type === 'split' && node.id === splitId
				? {
						...node,
						direction:
							node.direction === 'horizontal' ? 'vertical' : 'horizontal',
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
									: {
											...node,
											first,
											second,
										}
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
	const initialState = ensureDashboardState(defaultRoutePath)
	let root = $state(initialState.root)
	let focusedPanelId = $state(initialState.focusedPanelId)


	// (Derived)
	const focusedPanel = $derived(getPanelById(root, focusedPanelId))
	const panelIds = $derived(listPanelIds(root))


	// Functions
	const isPrefix = (a: string[], b: string[]) =>
		a.every((value, index) => value === b[index])
	const isSameRoute = (a: DashboardPanelRoute, b: DashboardPanelRoute) =>
		a.path === b.path &&
		Object.keys(a.params).length === Object.keys(b.params).length &&
		Object.entries(a.params).every(([key, value]) => b.params[key] === value)

	let pushedPanelId = $state<string | null>(null)
	let pushedHashes = $state<string[]>([])


	// Actions
	const setRoot = (nextRoot: DashboardNode) => (
		(root = nextRoot),
		setDashboardRoot(nextRoot)
	)

	const focusPanel = (panelId: string) => (
		(focusedPanelId = panelId),
		setDashboardFocus(panelId)
	)

	const splitFocusedPanel = (
		panelId: string,
		direction: 'horizontal' | 'vertical',
	) =>
		setRoot(
			splitPanel(root, panelId, direction, () => ({
				path: defaultRoutePath,
				params: {},
			})),
		)

	const removePanelById = (panelId: string) =>
		(() => {
			const nextRoot = removePanel(root, panelId) ?? root
			setRoot(nextRoot)
			if (focusedPanelId === panelId) {
				focusPanel(firstPanelId(nextRoot))
			}
		})()

	const swapPanel = (panelId: string) => setRoot(swapWithSibling(root, panelId))

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

	const updateSplitRatio = (splitId: string, ratio: number) =>
		setRoot(
			setSplitRatio(
				root,
				splitId,
				Math.max(RATIO_MIN, Math.min(RATIO_MAX, ratio)),
			),
		)

	const flipSplitDirection = (splitId: string) =>
		setRoot(toggleSplitDirection(root, splitId))

	const updatePanelRoute = (panelId: string, route: DashboardPanelRoute) =>
		setRoot(
			updatePanel(root, panelId, (panel) => ({
				...panel,
				route,
				hashHistory: [],
			})),
		)

	const navigatePanel = (
		panelId: string,
		route: DashboardPanelRoute,
		hash: string | null,
	) =>
		setRoot(
			updatePanel(root, panelId, (panel) =>
				isSameRoute(panel.route, route)
					? hash
						? {
								...panel,
								hashHistory: [...panel.hashHistory, hash],
							}
						: panel
					: {
							...panel,
							route,
							hashHistory: hash ? [hash] : [],
						},
			),
		)

	const appendPanelHash = (panelId: string, hash: string) =>
		setRoot(
			updatePanel(root, panelId, (panel) => ({
				...panel,
				hashHistory: [...panel.hashHistory, hash],
			})),
		)

	const setPanelHash = (panelId: string, hash: string, replace = true) =>
		setRoot(
			updatePanel(root, panelId, (panel) => ({
				...panel,
				hashHistory: replace ? [hash] : [...panel.hashHistory, hash],
			})),
		)

	const openInNewPanel = (
		panelId: string,
		route: DashboardPanelRoute,
		hash: string | null,
	) =>
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
				listPanelIds(nextRoot).find((id) => !beforeIds.includes(id)) ?? panelId,
			)
		})()

	$effect(() => {
		if (panelIds.length === 0) return
		if (panelIds.includes(focusedPanelId)) return
		setDashboardFocus(panelIds[0])
	})

	$effect(() => {
		if (!focusedPanel) return
		const nextHashes = focusedPanel.hashHistory
		const { previousPanelId, previousHashes } = untrack(() => ({
			previousPanelId: pushedPanelId,
			previousHashes: pushedHashes,
		}))
		const shouldReplace =
			previousPanelId !== focusedPanel.id ||
			!isPrefix(previousHashes, nextHashes)
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
		const newHashes = nextHashes.slice(previousHashes.length)
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

	$effect(() => {
		if (embeddedInPanel) return () => setIntentNavigateTo(null)
		setIntentNavigateTo((path, hash) => {
			const previousPanelIds = listPanelIds(root)
			const nextRoot = splitPanel(
				root,
				focusedPanelId,
				'vertical',
				() => ({ path, params: {} }),
				() => (hash ? [hash] : []),
			)
			const nextPanelIds = listPanelIds(nextRoot)
			const newPanelId =
				nextPanelIds.find((id) => !previousPanelIds.includes(id)) ?? null
			const updatedRoot = newPanelId
				? updatePanel(nextRoot, newPanelId, (panel) => ({
						...panel,
						hashHistory: [hash],
					}))
				: nextRoot
			setRoot(updatedRoot)
			if (newPanelId) focusPanel(newPanelId)
		})
		return () => setIntentNavigateTo(null)
	})
</script>


<svelte:head>
	<title>Dashboard</title>
</svelte:head>

{#if embeddedInPanel}
	<main id="main" class="dashboard dashboard-embedded" data-sticky-container>
		<nav class="dashboard-route-grid" aria-label="Routes">
			{#each panelRouteLinks as entry (entry.path)}
				<a
					href={resolve(buildRoutePath({ path: entry.path, params: {} }))}
					class="dashboard-route-link"
				>
					{entry.path === '/' ? 'Home' : entry.path}
				</a>
			{/each}
		</nav>
	</main>
{:else}
	<main id="main" class="dashboard" data-sticky-container>
		<section data-scroll-item class="dashboard-tree">
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
				onSetPanelHash={setPanelHash}
				onNavigate={navigatePanel}
				onOpenInNewPanel={openInNewPanel}
				onSetSplitRatio={updateSplitRatio}
				onSetSplitRatioOverride={setSplitRatioOverride}
				onClearSplitRatioOverride={clearSplitRatioOverride}
				onToggleSplitDirection={flipSplitDirection}
			/>
		</section>
	</main>
{/if}



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

	.dashboard-embedded {
		padding: 1rem;
	}

	.dashboard-route-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
		gap: 0.5rem;
	}

	.dashboard-route-link {
		padding: 0.5rem 0.75rem;
		border-radius: 0.35rem;
		border: 1px solid color-mix(in oklab, currentColor 25%, transparent);
		background: color-mix(in oklab, currentColor 6%, transparent);
		text-decoration: none;
		color: inherit;
	}

	.dashboard-route-link:hover {
		background: color-mix(in oklab, currentColor 12%, transparent);
		border-color: color-mix(in oklab, currentColor 40%, transparent);
	}
</style>
