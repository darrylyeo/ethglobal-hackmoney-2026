import type { DashboardNode, PanelNode, PanelTreeNode, SplitNode } from '$/data/PanelTree.ts'
import {
	createDashboard,
	deleteDashboard,
	getDefaultDashboardId,
	getDashboardState,
	listDashboards,
	renameDashboard,
	setDashboardFocus,
	setDashboardRoot,
	setDefaultDashboardId,
} from '$/collections/Dashboards.ts'

import type {
	dashboardIdSchema,
	renameDashboardSchema,
	setPanelRouteSchema,
	splitPanelSchema,
	setFocusSchema,
} from '$/lib/webmcp/schemas.ts'

type DashboardIdInput = (typeof dashboardIdSchema) extends { properties: infer P }
	? { [K in keyof P]: unknown }
	: never
type RenameInput = (typeof renameDashboardSchema) extends { properties: infer P }
	? { [K in keyof P]: unknown }
	: never
type SetPanelRouteInput = (typeof setPanelRouteSchema) extends { properties: infer P }
	? { [K in keyof P]: unknown }
	: never
type SplitPanelInput = (typeof splitPanelSchema) extends { properties: infer P }
	? { [K in keyof P]: unknown }
	: never
type SetFocusInput = (typeof setFocusSchema) extends { properties: infer P }
	? { [K in keyof P]: unknown }
	: never

const findPanelById = (
	node: PanelTreeNode,
	panelId: string,
): PanelNode | null => {
	if (node.type === 'panel') return node.id === panelId ? node : null
	const inFirst = findPanelById((node as SplitNode).first, panelId)
	return inFirst ?? findPanelById((node as SplitNode).second, panelId)
}

const updatePanelRouteInTree = (
	node: PanelTreeNode,
	panelId: string,
	route: { path: string; params: Record<string, string> },
): PanelTreeNode => {
	if (node.type === 'panel') {
		if (node.id === panelId)
			return { ...node, route: { path: route.path, params: route.params ?? {} } }
		return node
	}
	const s = node as SplitNode
	return {
		...s,
		first: updatePanelRouteInTree(s.first, panelId, route),
		second: updatePanelRouteInTree(s.second, panelId, route),
	}
}

const splitPanelInTree = (
	node: PanelTreeNode,
	panelId: string,
	direction: 'horizontal' | 'vertical',
	ratio: number,
	newPanelRoute: { path: string; params: Record<string, string> },
): PanelTreeNode => {
	if (node.type === 'panel') {
		if (node.id !== panelId) return node
		const newPanel: PanelNode = {
			id: crypto.randomUUID(),
			type: 'panel',
			route: newPanelRoute,
			hashHistory: [],
		}
		const split: SplitNode = {
			id: crypto.randomUUID(),
			type: 'split',
			direction,
			ratio,
			first: node,
			second: newPanel,
		}
		return split
	}
	const s = node as SplitNode
	return {
		...s,
		first: splitPanelInTree(s.first, panelId, direction, ratio, newPanelRoute),
		second: splitPanelInTree(s.second, panelId, direction, ratio, newPanelRoute),
	}
}

export const executeListDashboards = async () => {
	const defaultId = getDefaultDashboardId()
	return listDashboards().map((d) => ({
		id: d.id,
		name: d.name,
		isDefault: d.id === defaultId,
	}))
}

export const executeGetDashboard = async (input: DashboardIdInput) => {
	const state = getDashboardState(input.dashboardId as string)
	if (!state) return { error: 'Dashboard not found' }
	return {
		id: state.$id.id,
		name: state.name,
		focusedPanelId: state.focusedPanelId,
		root: state.root,
	}
}

export const executeCreateDashboard = async (
	input: { name?: string },
) => {
	const id = createDashboard(input.name as string)
	return { dashboardId: id }
}

export const executeDeleteDashboard = async (
	input: DashboardIdInput,
	requestUserInteraction?: (cb: () => Promise<boolean>) => Promise<boolean>,
) => {
	const id = input.dashboardId as string
	if (requestUserInteraction) {
		const ok = await requestUserInteraction(() => Promise.resolve(confirm(`Delete dashboard ${id}?`)))
		if (!ok) return { cancelled: true }
	}
	const deleted = deleteDashboard(id)
	return { dashboardId: id, deleted }
}

export const executeRenameDashboard = async (input: RenameInput) => {
	renameDashboard(input.dashboardId as string, input.name as string)
	return { dashboardId: input.dashboardId, name: input.name }
}

export const executeSetDefaultDashboard = async (input: DashboardIdInput) => {
	setDefaultDashboardId(input.dashboardId as string)
	return { dashboardId: input.dashboardId }
}

export const executeSetPanelRoute = async (input: SetPanelRouteInput) => {
	const id = input.dashboardId as string
	const panelId = input.panelId as string
	const path = (input.path as string) ?? '/'
	const params = ((input.params as Record<string, string>) ?? {}) as Record<string, string>

	const state = getDashboardState(id)
	if (!state) return { error: 'Dashboard not found' }
	const panel = findPanelById(state.root, panelId)
	if (!panel) return { error: 'Panel not found' }

	const updatedRoot = updatePanelRouteInTree(state.root, panelId, { path, params })
	setDashboardRoot(id, updatedRoot)
	return { dashboardId: id, panelId, path }
}

export const executeSplitPanel = async (input: SplitPanelInput) => {
	const id = input.dashboardId as string
	const panelId = input.panelId as string
	const direction = (input.direction as 'horizontal' | 'vertical') ?? 'horizontal'
	const ratio = (input.ratio as number) ?? 0.5
	const newRoute = (input.newPanelRoute as { path?: string; params?: Record<string, string> }) ?? {}
	const path = newRoute.path ?? '/session'
	const params = (newRoute.params ?? {}) as Record<string, string>

	const state = getDashboardState(id)
	if (!state) return { error: 'Dashboard not found' }
	const panel = findPanelById(state.root, panelId)
	if (!panel) return { error: 'Panel not found' }

	const updatedRoot = splitPanelInTree(state.root, panelId, direction, ratio, { path, params })
	setDashboardRoot(id, updatedRoot)
	const findNewPanelId = (node: PanelTreeNode): string | null => {
		if (node.type === 'split') {
			const s = node as SplitNode
			if (s.first.type === 'panel' && s.first.id === panelId && s.second.type === 'panel')
				return s.second.id
			return findNewPanelId(s.first) ?? findNewPanelId(s.second)
		}
		return null
	}
	return {
		dashboardId: id,
		panelId,
		newPanelId: findNewPanelId(updatedRoot),
	}
}

export const executeSetFocus = async (input: SetFocusInput) => {
	setDashboardFocus(input.dashboardId as string, input.panelId as string)
	return { dashboardId: input.dashboardId, panelId: input.panelId }
}
