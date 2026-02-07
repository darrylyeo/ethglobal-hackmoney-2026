import type {
	PanelNode,
	PanelRoute,
	PanelTreeNode,
	PanelTreeState,
	PanelTreeState$Id,
	SplitNode,
} from '$/data/PanelTree.ts'

export type DashboardPanelRoute = PanelRoute
export type DashboardPanelNode = PanelNode
export type DashboardSplitNode = SplitNode
export type DashboardNode = PanelTreeNode

export type DashboardState$Id = PanelTreeState$Id

export type DashboardState = PanelTreeState & { $id: DashboardState$Id }
