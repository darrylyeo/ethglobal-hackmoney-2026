/**
 * Dashboards collection: one row per dashboard + sentinel row for default id.
 * Persisted to localStorage across sessions.
 */

import { CollectionId } from '$/constants/collections.ts'
import type {
	DashboardNode,
	DashboardPanelNode,
	DashboardState,
	DashboardState$Id,
} from '$/data/DashboardPanel.ts'
import { SplitDirection } from '$/data/PanelTree.ts'
import { parse, stringify } from 'devalue'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'

export type DashboardStateRow = DashboardState

const DEFAULT_SENTINEL_ID = '__default__' as const
type DefaultDashboardRow = {
	$id: { id: typeof DEFAULT_SENTINEL_ID },
	defaultDashboardId: string,
}

export type DashboardRow = DashboardStateRow | DefaultDashboardRow

const isDefaultRow = (row: DashboardRow): row is DefaultDashboardRow =>
	row.$id.id === DEFAULT_SENTINEL_ID

const defaultRowKey = stringify({ id: DEFAULT_SENTINEL_ID })

const getRowKey = (row: DashboardRow) => stringify(row.$id)

const createPanelNode = (routePath: string): DashboardPanelNode => ({
	id: crypto.randomUUID(),
	type: 'panel',
	route: {
		path: routePath,
		params: {},
	},
	hashHistory: [],
})

const DEFAULT_DASHBOARD_NAME = 'My Dashboard'

const createDefaultTree = (routePath: string): DashboardStateRow => {
	const sessionPanel = createPanelNode('/session')
	const sessionsPanel = createPanelNode('/sessions')
	const root: DashboardNode = {
		id: crypto.randomUUID(),
		type: 'split',
		direction: SplitDirection.Horizontal,
		ratio: 0.5,
		first: sessionPanel,
		second: sessionsPanel,
	}
	return {
		$id: { id: 'default' },
		root,
		focusedPanelId: sessionPanel.id,
	}
}

const createDashboardRow = (
	id: string,
	routePath: string,
	name?: string,
): DashboardStateRow => ({
	...createDefaultTree(routePath),
	$id: { id },
	name,
})

const createFarcasterTree = (): DashboardStateRow => {
	const castsPanel = createPanelNode('/farcaster/casts')
	const channelsPanel = createPanelNode('/farcaster/channels')
	const root: DashboardNode = {
		id: crypto.randomUUID(),
		type: 'split',
		direction: SplitDirection.Horizontal,
		ratio: 0.5,
		first: castsPanel,
		second: channelsPanel,
	}
	return {
		$id: { id: 'farcaster' },
		root,
		focusedPanelId: castsPanel.id,
	}
}

export const ensureFarcasterDashboardState = (): DashboardStateRow => {
	ensureDefaultRow()
	const id = 'farcaster'
	const key = stateKey(id)
	const existing = dashboardsCollection.state.get(key) as
		| DashboardStateRow
		| undefined
	if (existing) return existing
	const created = createFarcasterTree()
	dashboardsCollection.insert(created)
	return created
}

export const dashboardsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.Dashboards,
		storageKey: CollectionId.Dashboards,
		getKey: (row: DashboardRow) => getRowKey(row),
		parser: { stringify, parse },
	}),
)

for (const [key, row] of dashboardsCollection.state) {
	if (row.$source !== DataSource.Local) {
		dashboardsCollection.update(key, (draft) => {
			draft.$source = DataSource.Local
		})
	}
}

export const ensureDefaultRow = () => {
	if (dashboardsCollection.state.get(defaultRowKey)) return
	const firstDashboardKey = [...dashboardsCollection.state].find(
		([, row]) => !isDefaultRow(row),
	)?.[0]
	const defaultId =
		firstDashboardKey != null
			? (parse(firstDashboardKey) as DashboardState$Id).id
			: (() => {
					const created = createDashboardRow(
						'default',
						'/session',
						DEFAULT_DASHBOARD_NAME,
					)
					dashboardsCollection.insert(created)
					return 'default'
				})()
	dashboardsCollection.insert({
		$id: { id: DEFAULT_SENTINEL_ID },
		defaultDashboardId: defaultId,
	})
}

export const getDefaultDashboardId = (): string => {
	ensureDefaultRow()
	return (
		(dashboardsCollection.state.get(defaultRowKey) as
			| DefaultDashboardRow
			| undefined)?.defaultDashboardId ?? 'default'
	)
}

export const setDefaultDashboardId = (id: string) => {
	ensureDefaultRow()
	const key = defaultRowKey
	dashboardsCollection.update(key, (draft) => {
		;(draft as DefaultDashboardRow).defaultDashboardId = id
	})
}

export const listDashboards = (): { id: string, name?: string }[] => {
	ensureDefaultRow()
	return [...dashboardsCollection.state]
		.filter(([, row]) => !isDefaultRow(row))
		.map(([, row]) => ({
			id: (row as DashboardStateRow).$id.id,
			name: (row as DashboardStateRow).name,
		}))
}

const stateKey = (id: string) => stringify({ id })

export const getDashboardState = (id: string): DashboardStateRow | undefined =>
	dashboardsCollection.state.get(stateKey(id)) as
		| DashboardStateRow
		| undefined

export const ensureDashboardState = (
	routePath: string,
	dashboardId?: string,
): DashboardStateRow => {
	ensureDefaultRow()
	const id = dashboardId ?? getDefaultDashboardId()
	const key = stateKey(id)
	const existing = dashboardsCollection.state.get(key) as
		| DashboardStateRow
		| undefined
	if (existing) return existing
	const created = createDashboardRow(
		id,
		routePath,
		id === 'default' ? DEFAULT_DASHBOARD_NAME : undefined,
	)
	dashboardsCollection.insert(created)
	if (id === getDefaultDashboardId()) return created
	return created
}

export const updateDashboardState = (
	id: string,
	apply: (state: DashboardStateRow) => DashboardStateRow,
) => {
	const key = stateKey(id)
	const row = dashboardsCollection.state.get(key) as
		| DashboardStateRow
		| undefined
	if (!row) return undefined
	dashboardsCollection.update(key, (draft) => {
		Object.assign(draft, apply(draft as DashboardStateRow))
	})
	return undefined
}

export const setDashboardRoot = (id: string, root: DashboardNode) => {
	const key = stateKey(id)
	const row = dashboardsCollection.state.get(key) as
		| DashboardStateRow
		| undefined
	if (!row) return undefined
	dashboardsCollection.update(key, (draft) => {
		;(draft as DashboardStateRow).root = root
	})
	return undefined
}

export const setDashboardFocus = (id: string, panelId: string) => {
	const key = stateKey(id)
	const row = dashboardsCollection.state.get(key) as
		| DashboardStateRow
		| undefined
	if (!row) return undefined
	dashboardsCollection.update(key, (draft) => {
		;(draft as DashboardStateRow).focusedPanelId = panelId
	})
	return undefined
}

export const createDashboard = (name?: string): string => {
	ensureDefaultRow()
	const id = crypto.randomUUID()
	const row = createDashboardRow(id, '/session', name)
	dashboardsCollection.insert(row)
	return id
}

export const deleteDashboard = (id: string): boolean => {
	ensureDefaultRow()
	const defaultId = getDefaultDashboardId()
	const keys = [...dashboardsCollection.state]
		.filter(([, row]) => !isDefaultRow(row))
		.map(([k]) => k)
	if (keys.length <= 1) return false
	const key = stateKey(id)
	if (!dashboardsCollection.state.get(key)) return false
	if (id === defaultId) {
		const other = keys.find((k) => k !== key)
		if (other != null) setDefaultDashboardId((parse(other) as { id: string }).id)
	}
	dashboardsCollection.delete(key)
	return true
}

export const renameDashboard = (id: string, name: string) => {
	const key = stateKey(id)
	const row = dashboardsCollection.state.get(key) as
		| DashboardStateRow
		| undefined
	if (!row) return undefined
	dashboardsCollection.update(key, (draft) => {
		;(draft as DashboardStateRow).name = name
	})
	return undefined
}

export const setDashboardIcon = (id: string, icon: string) => {
	const key = stateKey(id)
	const row = dashboardsCollection.state.get(key) as
		| DashboardStateRow
		| undefined
	if (!row) return undefined
	dashboardsCollection.update(key, (draft) => {
		;(draft as DashboardStateRow).icon = icon
	})
	return undefined
}

export const dashboardStateId: DashboardState$Id = { id: 'default' }
