import {
	createSessionSchema,
	sessionIdSchema,
	updateSessionParamsSchema,
	navigateSchema,
	watchEntitySchema,
	unwatchEntitySchema,
	dashboardIdSchema,
	renameDashboardSchema,
	setPanelRouteSchema,
	splitPanelSchema,
	setFocusSchema,
	resolveIntentSchema,
	createSessionFromIntentSchema,
} from '$/lib/webmcp/schemas.ts'
import {
	executeCreateSession,
	executeExecuteSession,
	executeGetSession,
	executeSimulateSession,
	executeUpdateSessionParams,
} from '$/lib/webmcp/tools/action-flows.ts'
import {
	executeNavigate,
	executeListWatchedEntities,
	executeWatchEntity,
	executeUnwatchEntity,
	executeGetCurrentRoute,
} from '$/lib/webmcp/tools/navigation.ts'
import {
	executeListDashboards,
	executeGetDashboard,
	executeCreateDashboard,
	executeDeleteDashboard,
	executeRenameDashboard,
	executeSetDefaultDashboard,
	executeSetPanelRoute,
	executeSplitPanel,
	executeSetFocus,
} from '$/lib/webmcp/tools/dashboards.ts'
import {
	executeResolveIntent,
	executeCreateSessionFromIntent,
} from '$/lib/webmcp/tools/intents.ts'

import type { EIP1193Provider } from '$/lib/wallet.ts'

export type ExecuteContext = {
	requestUserInteraction?: (
		callback: () => Promise<unknown>,
	) => Promise<unknown>
	getPaymentProvider?: () => EIP1193Provider | null
}

export type ToolDefinition = {
	name: string
	description: string
	inputSchema: object
	annotations?: { readOnlyHint?: boolean }
}

const tools: (ToolDefinition & { execute: (input: unknown, ctx: ExecuteContext) => Promise<unknown> })[] = [
	{
		name: 'createSession',
		description: 'Create a new transaction session (swap, bridge, transfer, liquidity). Optionally persist and navigate.',
		inputSchema: createSessionSchema,
		execute: (i, _ctx) => executeCreateSession(i as Parameters<typeof executeCreateSession>[0]),
	},
	{
		name: 'updateSessionParams',
		description: 'Update parameters for an existing session.',
		inputSchema: updateSessionParamsSchema,
		execute: (i, _ctx) => executeUpdateSessionParams(i as Parameters<typeof executeUpdateSessionParams>[0]),
	},
	{
		name: 'getSession',
		description: 'Read a session by id.',
		inputSchema: sessionIdSchema,
		annotations: { readOnlyHint: true },
		execute: (i, _ctx) => executeGetSession(i as Parameters<typeof executeGetSession>[0]),
	},
	{
		name: 'simulateSession',
		description: 'Run TEVM simulation for a session. Navigates to the session and triggers simulation; user confirmation may be required.',
		inputSchema: sessionIdSchema,
		execute: (i, ctx) =>
			executeSimulateSession(
				i as Parameters<typeof executeSimulateSession>[0],
				ctx.requestUserInteraction,
			),
	},
	{
		name: 'executeSession',
		description: 'Sign and broadcast the first action of a session. Navigates to the session and triggers execution; user must sign in wallet.',
		inputSchema: sessionIdSchema,
		execute: (i, ctx) =>
			executeExecuteSession(
				i as Parameters<typeof executeExecuteSession>[0],
				ctx.requestUserInteraction,
			),
	},
	{
		name: 'navigate',
		description: 'Navigate to a route. Use target "panel" when in dashboard to update focused panel.',
		inputSchema: navigateSchema,
		execute: (i, _ctx) => executeNavigate(i as Parameters<typeof executeNavigate>[0]),
	},
	{
		name: 'listWatchedEntities',
		description: 'List watched entities in the navigation.',
		inputSchema: { type: 'object', properties: {} },
		annotations: { readOnlyHint: true },
		execute: (_i, _ctx) => executeListWatchedEntities(),
	},
	{
		name: 'watchEntity',
		description: 'Add an entity to the watched list.',
		inputSchema: watchEntitySchema,
		execute: (i, _ctx) => executeWatchEntity(i as Parameters<typeof executeWatchEntity>[0]),
	},
	{
		name: 'unwatchEntity',
		description: 'Remove an entity from the watched list.',
		inputSchema: unwatchEntitySchema,
		execute: (i, _ctx) => executeUnwatchEntity(i as Parameters<typeof executeUnwatchEntity>[0]),
	},
	{
		name: 'getCurrentRoute',
		description: 'Get the current route (pathname, search, hash).',
		inputSchema: { type: 'object', properties: {} },
		annotations: { readOnlyHint: true },
		execute: (_i, _ctx) => executeGetCurrentRoute(),
	},
	{
		name: 'listDashboards',
		description: 'List all dashboards with id, name, and isDefault.',
		inputSchema: { type: 'object', properties: {} },
		annotations: { readOnlyHint: true },
		execute: (_i, _ctx) => executeListDashboards(),
	},
	{
		name: 'getDashboard',
		description: 'Get dashboard state by id.',
		inputSchema: dashboardIdSchema,
		annotations: { readOnlyHint: true },
		execute: (i, _ctx) => executeGetDashboard(i as Parameters<typeof executeGetDashboard>[0]),
	},
	{
		name: 'createDashboard',
		description: 'Create a new dashboard.',
		inputSchema: { type: 'object', properties: { name: { type: 'string' } } },
		execute: (i, _ctx) => executeCreateDashboard((i ?? {}) as Parameters<typeof executeCreateDashboard>[0]),
	},
	{
		name: 'deleteDashboard',
		description: 'Delete a dashboard. Requires user confirmation.',
		inputSchema: dashboardIdSchema,
		execute: (i, ctx) =>
			executeDeleteDashboard(
				i as Parameters<typeof executeDeleteDashboard>[0],
				ctx.requestUserInteraction as Parameters<typeof executeDeleteDashboard>[1],
			),
	},
	{
		name: 'renameDashboard',
		description: 'Rename a dashboard.',
		inputSchema: renameDashboardSchema,
		execute: (i, _ctx) => executeRenameDashboard(i as Parameters<typeof executeRenameDashboard>[0]),
	},
	{
		name: 'setDefaultDashboard',
		description: 'Set the default dashboard.',
		inputSchema: dashboardIdSchema,
		execute: (i, _ctx) => executeSetDefaultDashboard(i as Parameters<typeof executeSetDefaultDashboard>[0]),
	},
	{
		name: 'setPanelRoute',
		description: 'Change a panel route in a dashboard.',
		inputSchema: setPanelRouteSchema,
		execute: (i, _ctx) => executeSetPanelRoute(i as Parameters<typeof executeSetPanelRoute>[0]),
	},
	{
		name: 'splitPanel',
		description: 'Split a panel horizontally or vertically.',
		inputSchema: splitPanelSchema,
		execute: (i, _ctx) => executeSplitPanel(i as Parameters<typeof executeSplitPanel>[0]),
	},
	{
		name: 'setFocus',
		description: 'Set the focused panel in a dashboard.',
		inputSchema: setFocusSchema,
		execute: (i, _ctx) => executeSetFocus(i as Parameters<typeof executeSetFocus>[0]),
	},
	{
		name: 'resolveIntent',
		description: 'Resolve an intent from source and target entity (same as drag-and-drop).',
		inputSchema: resolveIntentSchema,
		annotations: { readOnlyHint: true },
		execute: (i, _ctx) => executeResolveIntent(i as Parameters<typeof executeResolveIntent>[0]),
	},
	{
		name: 'createSessionFromIntent',
		description: 'Create a session from a resolved intent option (source + target + optionIndex).',
		inputSchema: createSessionFromIntentSchema,
		execute: (i, _ctx) =>
			executeCreateSessionFromIntent(i as Parameters<typeof executeCreateSessionFromIntent>[0]),
	},
]

export const getToolDefinitions = (filter?: string[]): ToolDefinition[] =>
	(filter
		? tools.filter((t) => filter.includes(t.name))
		: tools
	).map(({ name, description, inputSchema, annotations }) => ({
		name,
		description,
		inputSchema,
		annotations,
	}))

export const executeTool = async (
	name: string,
	input: unknown,
	context: ExecuteContext,
): Promise<unknown> => {
	const tool = tools.find((t) => t.name === name)
	if (!tool) throw new Error(`Unknown tool: ${name}`)
	return tool.execute(input ?? {}, context)
}
