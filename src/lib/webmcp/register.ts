import { getToolDefinitions, executeTool } from '$/lib/webmcp/handlers.ts'
import { loadPolyfill } from '$/lib/webmcp/polyfill.ts'

type ModelContextClient = {
	requestUserInteraction?: (callback: () => Promise<unknown>) => Promise<unknown>
} | null

type ModelContext = {
	provideContext: (options: { tools: unknown[] }) => void
	clearContext: () => void
}

type NavigatorWithModelContext = Navigator & {
	modelContext?: ModelContext
}

export const registerWebMcpTools = async (): Promise<boolean> => {
	await loadPolyfill()
	const nav = navigator as NavigatorWithModelContext
	const mc = nav.modelContext
	if (!mc) return false

	const definitions = getToolDefinitions()
	mc.provideContext({
		tools: definitions.map((d) => ({
			name: d.name,
			description: d.description,
			inputSchema: d.inputSchema,
			annotations: d.annotations,
			execute: async (
				input: object,
				client: ModelContextClient,
			) => {
				const ctx = {
					requestUserInteraction: client?.requestUserInteraction,
				}
				return executeTool(d.name, input, ctx)
			},
		})),
	})
	return true
}

export const clearWebMcpTools = (): void => {
	const nav = navigator as NavigatorWithModelContext
	const mc = nav.modelContext
	if (mc?.clearContext) mc.clearContext()
}
