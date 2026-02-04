/**
 * Dashboard panels collection: tiling tree + focus + panel history.
 * Persisted to localStorage across sessions.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { DataSource } from '$/constants/data-sources'
import type {
	DashboardNode,
	DashboardPanelNode,
	DashboardState,
	DashboardState$Id,
} from '$/data/DashboardPanel'

export type DashboardStateRow = DashboardState & { $source: DataSource }

export const dashboardStateId: DashboardState$Id = { id: 'default' }
const dashboardStateKey = stringify(dashboardStateId)

const createPanelNode = (routePath: string): DashboardPanelNode => ({
	id: crypto.randomUUID(),
	type: 'panel',
	route: {
		path: routePath,
		params: {},
	},
	hashHistory: [],
})

const createDefaultState = (_routePath: string): DashboardStateRow => {
	const sessionPanel = createPanelNode('/session')
	const sessionsPanel = createPanelNode('/sessions')
	const root: DashboardNode = {
		id: crypto.randomUUID(),
		type: 'split',
		direction: 'horizontal',
		ratio: 0.5,
		first: sessionPanel,
		second: sessionsPanel,
	}
	return {
		$id: dashboardStateId,
		$source: DataSource.Local,
		root,
		focusedPanelId: sessionPanel.id,
	}
}

export const dashboardPanelsCollection = createCollection(
	localStorageCollectionOptions({
		id: 'dashboardPanels',
		storageKey: 'dashboard-panels',
		getKey: (row: DashboardStateRow) => stringify(row.$id),
		parser: { stringify, parse },
	}),
)

for (const [key, row] of dashboardPanelsCollection.state) {
	if (row.$source !== DataSource.Local) {
		dashboardPanelsCollection.update(key, (draft) => {
			draft.$source = DataSource.Local
		})
	}
}

export const ensureDashboardState = (routePath: string) =>
	(
		dashboardPanelsCollection.state.get(dashboardStateKey)
		?? (() => {
			const created = createDefaultState(routePath)
			dashboardPanelsCollection.insert(created)
			return created
		})()
	)

export const getDashboardState = () =>
	dashboardPanelsCollection.state.get(dashboardStateKey)

export const updateDashboardState = (
	apply: (state: DashboardStateRow) => DashboardStateRow,
) =>
	(
		dashboardPanelsCollection.state.get(dashboardStateKey) ?
			dashboardPanelsCollection.update(dashboardStateKey, (draft) => {
				Object.assign(draft, apply(draft))
			})
		: undefined
	)

export const setDashboardRoot = (root: DashboardNode) =>
	(
		dashboardPanelsCollection.state.get(dashboardStateKey) ?
			dashboardPanelsCollection.update(dashboardStateKey, (draft) => {
				draft.root = root
			})
		: undefined
	)

export const setDashboardFocus = (panelId: string) =>
	(
		dashboardPanelsCollection.state.get(dashboardStateKey) ?
			dashboardPanelsCollection.update(dashboardStateKey, (draft) => {
				draft.focusedPanelId = panelId
			})
		: undefined
	)
