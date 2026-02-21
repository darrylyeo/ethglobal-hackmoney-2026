export enum SplitDirection {
	Horizontal = 'horizontal',
	Vertical = 'vertical',
}

export type PanelRoute = {
	path: string,
	params: Record<string, string>,
}

export type PanelNode = {
	id: string,
	type: 'panel',
	route: PanelRoute,
	hashHistory: string[],
}

export type SplitNode = {
	id: string,
	type: 'split',
	direction: SplitDirection,
	ratio: number,
	first: PanelTreeNode,
	second: PanelTreeNode,
}

export type PanelTreeNode = PanelNode | SplitNode

export type PanelTreeState$Id = {
	id: string,
}

export type PanelTreeState = {
	$id: PanelTreeState$Id,
	name?: string,
	icon?: string,
	root: PanelTreeNode,
	focusedPanelId: string,
}
