import type {
	DashboardNode,
	DashboardPanelNode,
	DashboardPanelRoute,
	DashboardSplitNode,
} from '$/data/DashboardPanel'

export const createPanelNode = (
	route: DashboardPanelRoute,
): DashboardPanelNode => ({
	id: crypto.randomUUID(),
	type: 'panel',
	route,
	hashHistory: [],
})

export const getPanelById = (node: DashboardNode, panelId: string) =>
	(
		node.type === 'panel' ?
			(node.id === panelId ? node : null)
		:
			(
				getPanelById(node.first, panelId)
				?? getPanelById(node.second, panelId)
			)
	)

const updateNode = (
	node: DashboardNode,
	apply: (target: DashboardNode) => DashboardNode | null,
) =>
	(
		apply(node)
		?? (
			node.type === 'split' ?
				(() => {
					const first = updateNode(node.first, apply)
					const second = updateNode(node.second, apply)
					return first === node.first && second === node.second ?
						node
					:
						{
							...node,
							first,
							second,
						}
				})()
			:
				node
		)
	)

export const updatePanel = (
	root: DashboardNode,
	panelId: string,
	update: (panel: DashboardPanelNode) => DashboardPanelNode,
) =>
	(
		updateNode(root, (node) =>
			node.type === 'panel' && node.id === panelId ?
				update(node)
			:
				null,
		)
	)

export const splitPanel = (
	root: DashboardNode,
	panelId: string,
	direction: DashboardSplitNode['direction'],
	createRoute: () => DashboardPanelRoute,
) =>
	(
		updateNode(root, (node) =>
			node.type === 'panel' && node.id === panelId ?
				{
					id: crypto.randomUUID(),
					type: 'split',
					direction,
					ratio: 0.5,
					first: node,
					second: createPanelNode(createRoute()),
				}
			:
				null,
		)
	)

export const swapWithSibling = (root: DashboardNode, panelId: string) =>
	(
		updateNode(root, (node) =>
			node.type === 'split' ?
				(
					(node.first.type === 'panel' && node.first.id === panelId)
					|| (node.second.type === 'panel' && node.second.id === panelId)
				) ?
					{
						...node,
						first: node.second,
						second: node.first,
					}
				:
					null
			:
				null,
		)
	)

export const setSplitRatio = (
	root: DashboardNode,
	splitId: string,
	ratio: number,
) =>
	(
		updateNode(root, (node) =>
			node.type === 'split' && node.id === splitId ?
				{
					...node,
					ratio,
				}
			:
				null,
		)
	)

export const toggleSplitDirection = (
	root: DashboardNode,
	splitId: string,
) =>
	(
		updateNode(root, (node) =>
			node.type === 'split' && node.id === splitId ?
				{
					...node,
					direction: node.direction === 'horizontal' ? 'vertical' : 'horizontal',
				}
			:
				null,
		)
	)

export const removePanel = (
	root: DashboardNode,
	panelId: string,
) => {
	const removeResult = (node: DashboardNode): DashboardNode | null =>
		(
			node.type === 'panel' ?
				(node.id === panelId ? null : node)
			:
				(() => {
					const first = removeResult(node.first)
					const second = first ? removeResult(node.second) : null
					return !first ?
						node.second
					: !second ?
						node.first
					: first === node.first && second === node.second ?
						node
					:
						{
							...node,
							first,
							second,
						}
				})()
		)
	return removeResult(root)
}

export const firstPanelId = (node: DashboardNode): string =>
	(
		node.type === 'panel' ? node.id : firstPanelId(node.first)
	)

export const listPanelIds = (node: DashboardNode): string[] =>
	(
		node.type === 'panel' ?
			[node.id]
		:
			[
				...listPanelIds(node.first),
				...listPanelIds(node.second),
			]
	)
