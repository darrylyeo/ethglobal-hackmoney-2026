/**
 * Bridge WebMCP tool definitions to AI SDK tool format for agent chat.
 * Used when LlmProvider supports generateWithTools (connection providers).
 */

import { jsonSchema, tool } from 'ai'
import type { ExecuteContext } from '$/lib/webmcp/handlers.ts'
import { getToolDefinitions, executeTool } from '$/lib/webmcp/handlers.ts'

export const TOOLS_FOR_CHAT = [
	'getSession',
	'navigate',
	'listWatchedEntities',
	'watchEntity',
	'unwatchEntity',
	'getCurrentRoute',
	'listDashboards',
	'getDashboard',
	'createDashboard',
	'renameDashboard',
	'setDefaultDashboard',
	'setPanelRoute',
	'setFocus',
	'resolveIntent',
	'createSessionFromIntent',
	'createSession',
	'updateSessionParams',
] as const

export function buildAISdkToolsFromWebmcp(
	toolNames: readonly string[],
	requestUserInteraction?: ExecuteContext['requestUserInteraction'],
	getPaymentProvider?: ExecuteContext['getPaymentProvider'],
): Record<string, ReturnType<typeof tool>> {
	const defs = getToolDefinitions([...toolNames])
	const record: Record<string, ReturnType<typeof tool>> = {}
	const context: ExecuteContext = {
		requestUserInteraction: requestUserInteraction
			? (cb) =>
				(cb() as Promise<boolean>).then((ok) => ok ?? false)
			: undefined,
		getPaymentProvider,
	}
	for (const d of defs) {
		record[d.name] = tool({
			description: d.description,
			parameters: jsonSchema(d.inputSchema as object),
			execute: async (args: unknown) => executeTool(d.name, args ?? {}, context),
		})
	}
	return record
}
