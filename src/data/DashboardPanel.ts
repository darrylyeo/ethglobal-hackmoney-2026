export type DashboardPanelRoute = {
	path: string,
	params: Record<string, string>,
}

export type DashboardPanelNode = {
	id: string,
	type: 'panel',
	route: DashboardPanelRoute,
	hashHistory: string[],
}

export type DashboardSplitNode = {
	id: string,
	type: 'split',
	direction: 'horizontal' | 'vertical',
	ratio: number,
	first: DashboardNode,
	second: DashboardNode,
}

export type DashboardNode = DashboardPanelNode | DashboardSplitNode

export type DashboardState$Id = {
	id: 'default',
}

export type DashboardState = {
	$id: DashboardState$Id,
	root: DashboardNode,
	focusedPanelId: string,
}

