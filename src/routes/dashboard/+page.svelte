<script lang="ts">
	// Types/constants
	import type {
		DashboardNode,
		DashboardPanelNode,
		DashboardPanelRoute,
		DashboardSplitNode,
	} from '$/data/DashboardPanel.ts'

	import { untrack } from 'svelte'
	import { and, eq, not, useLiveQuery } from '@tanstack/svelte-db'
	import { page } from '$app/state'
	import { pushState, replaceState } from '$app/navigation'
	import { resolve } from '$app/paths'
	import {
		dashboardPanelsCollection,
		ensureDashboardState,
		setDashboardFocus,
		setDashboardRoot,
	} from '$/collections/dashboard-panels.ts'
	import { setIntentNavigateTo } from '$/state/intent-navigation.svelte.ts'


	// Functions
	import { buildRoutePath, defaultRoutePath, routeEntries } from './route-map.ts'


	// Components
	import PanelTree from './PanelTree.svelte'


	// Props
	let {
		data = {},
	}: {
		data?: Record<string, unknown>,
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
	const defaultDashboardRowQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardPanelsCollection })
				.where(({ row }) => eq(row.$id.id, '__default__'))
				.select(({ row }) =>
					'defaultDashboardId' in row
						? { defaultDashboardId: row.defaultDashboardId }
						: { defaultDashboardId: undefined as string | undefined },
				),
		[],
	)
	const defaultDashboardId = $derived(
		defaultDashboardRowQuery.data?.[0]?.defaultDashboardId ?? 'default',
	)
	const dashboardId = $derived(
		page.url.searchParams.get('d') ?? defaultDashboardId,
	)
	const dashboardRowQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardPanelsCollection })
				.where(({ row }) =>
					and(
						not(eq(row.$id.id, '__default__')),
						eq(row.$id.id, dashboardId),
					),
				)
				.select(({ row }) => ({ row })),
		[() => dashboardId],
	)
	$effect(() => {
		const id = dashboardId
		if (!id) return
		const row = dashboardRowQuery.data?.[0]?.row
		if (!row) ensureDashboardState(defaultRoutePath, id)
	})
	const dashboardRow = $derived(dashboardRowQuery.data?.[0]?.row)
	const root = $derived(
		dashboardRow && 'root' in dashboardRow ? dashboardRow.root : undefined,
	)
	const focusedPanelId = $derived(
		dashboardRow && 'focusedPanelId' in dashboardRow
			? dashboardRow.focusedPanelId
			: '',
	)


	// (Derived)
	const focusedPanel = $derived(
		root ? getPanelById(root, focusedPanelId) : null,
	)
	const panelIds = $derived(root ? listPanelIds(root) : [])


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
	const setRoot = (nextRoot: DashboardNode) =>
		setDashboardRoot(dashboardId, nextRoot)

	const focusPanel = (panelId: string) =>
		setDashboardFocus(dashboardId, panelId)

	const splitFocusedPanel = (
		panelId: string,
		direction: 'horizontal' | 'vertical',
	) => {
		if (!root) return
		setRoot(
			splitPanel(root, panelId, direction, () => ({
				path: defaultRoutePath,
				params: {},
			})),
		)
	}

	const removePanelById = (panelId: string) => {
		if (!root) return
		const nextRoot = removePanel(root, panelId) ?? root
		setRoot(nextRoot)
		if (focusedPanelId === panelId) {
			focusPanel(firstPanelId(nextRoot))
		}
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
	}

	$effect(() => {
		if (!dashboardRow || panelIds.length === 0) return
		if (panelIds.includes(focusedPanelId)) return
		setDashboardFocus(dashboardId, panelIds[0])
	})

	$effect(() => {
		if (!dashboardRow || !focusedPanel) return
		const nextHashes = focusedPanel.hashHistory
		const { previousPanelId, previousHashes } = untrack(() => ({
			previousPanelId: pushedPanelId,
			previousHashes: pushedHashes,
		}))
		const shouldReplace =
			previousPanelId !== focusedPanel.id ||
			!isPrefix(previousHashes, nextHashes)
		if (shouldReplace) {
			replaceState(
				resolve(
					dashboardId === defaultDashboardId
						? '/dashboard'
						: `/dashboard?d=${dashboardId}`,
				),
				{
					panelId: focusedPanel.id,
					hash: null,
					route: buildRoutePath(focusedPanel.route),
				},
			)
			for (const hash of nextHashes) {
				pushState(
					resolve(
						(dashboardId === defaultDashboardId
							? '/dashboard'
							: `/dashboard?d=${dashboardId}`) + hash,
					),
					{
						panelId: focusedPanel.id,
						hash,
						route: buildRoutePath(focusedPanel.route),
					},
				)
			}
			pushedPanelId = focusedPanel.id
			pushedHashes = [...nextHashes]
			return
		}
		const newHashes = nextHashes.slice(previousHashes.length)
		for (const hash of newHashes) {
			pushState(
				resolve(
					(dashboardId === defaultDashboardId
						? '/dashboard'
						: `/dashboard?d=${dashboardId}`) + hash,
				),
				{
					panelId: focusedPanel.id,
					hash,
					route: buildRoutePath(focusedPanel.route),
				},
			)
		}
		if (newHashes.length > 0) {
			pushedHashes = [...nextHashes]
		}
	})

	$effect(() => {
		if (embeddedInPanel || !root) return () => setIntentNavigateTo(null)
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
	<main
		id="main"
		class="dashboard dashboard-embedded"
		data-sticky-container
	>
		<nav
			data-grid="columns-autofit gap-2"
			aria-label="Routes"
		>
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
{:else if dashboardRow && 'root' in dashboardRow}
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
				root={dashboardRow.root}
				focusedPanelId={dashboardRow.focusedPanelId}
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
{:else}
	<main id="main" class="dashboard" data-sticky-container>
		<p>Loading dashboard…</p>
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
