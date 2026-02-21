import { describe, expect, it, vi } from 'vitest'
import { EntityType } from '$/data/$EntityType.ts'
import {
	getToolDefinitions,
	executeTool,
} from '$/lib/webmcp/handlers.ts'
import {
	createSessionSchema,
	resolveIntentSchema,
	createSessionFromIntentSchema,
} from '$/lib/webmcp/schemas.ts'


const { mockGoto, mockCreateSession, mockBuildSessionPath } = vi.hoisted(() => ({
	mockGoto: vi.fn(),
	mockCreateSession: vi.fn(() => ({ id: 'mock-session-id' })),
	mockBuildSessionPath: vi.fn((id: string) => `/session/${id}`),
}))

vi.mock('$app/navigation', () => ({ goto: mockGoto }))
vi.mock('$/lib/session/sessions.ts', () => ({
	createSession: mockCreateSession,
	buildSessionPath: mockBuildSessionPath,
}))

import { executeResolveIntent, executeCreateSessionFromIntent } from '$/lib/webmcp/tools/intents.ts'


const isObjectSchema = (s: unknown): s is { type: string; properties?: object } =>
	typeof s === 'object' && s != null && 'type' in s && (s as { type: string }).type === 'object'

describe('getToolDefinitions', () => {
	it('returns all expected tools', () => {
		const defs = getToolDefinitions()
		const names = defs.map((d) => d.name)
		expect(names).toContain('createSession')
		expect(names).toContain('updateSessionParams')
		expect(names).toContain('getSession')
		expect(names).toContain('navigate')
		expect(names).toContain('listWatchedEntities')
		expect(names).toContain('watchEntity')
		expect(names).toContain('unwatchEntity')
		expect(names).toContain('getCurrentRoute')
		expect(names).toContain('listDashboards')
		expect(names).toContain('getDashboard')
		expect(names).toContain('createDashboard')
		expect(names).toContain('deleteDashboard')
		expect(names).toContain('renameDashboard')
		expect(names).toContain('setDefaultDashboard')
		expect(names).toContain('setPanelRoute')
		expect(names).toContain('splitPanel')
		expect(names).toContain('setFocus')
		expect(names).toContain('resolveIntent')
		expect(names).toContain('createSessionFromIntent')
	})

	it('filters by names when filter provided', () => {
		const defs = getToolDefinitions(['resolveIntent', 'createSessionFromIntent'])
		expect(defs.map((d) => d.name)).toEqual(['resolveIntent', 'createSessionFromIntent'])
	})

	it('each tool has valid inputSchema (object with type and properties)', () => {
		for (const def of getToolDefinitions()) {
			expect(def.inputSchema).toBeDefined()
			expect(isObjectSchema(def.inputSchema) || def.inputSchema).toBeTruthy()
			if (isObjectSchema(def.inputSchema)) {
				expect(def.inputSchema.properties).toBeDefined()
				expect(typeof def.inputSchema.properties).toBe('object')
			}
		}
	})
})

describe('tool schemas', () => {
	it('createSessionSchema has template enum and actions array', () => {
		expect(createSessionSchema.type).toBe('object')
		expect(createSessionSchema.properties?.template).toBeDefined()
		expect((createSessionSchema.properties?.template as { enum?: string[] })?.enum).toContain('Swap')
		expect(createSessionSchema.properties?.actions).toBeDefined()
	})

	it('resolveIntentSchema has sourceEntityRef and targetEntityRef', () => {
		expect(resolveIntentSchema.required).toContain('sourceEntityRef')
		expect(resolveIntentSchema.required).toContain('targetEntityRef')
	})

	it('createSessionFromIntentSchema has sourceEntityRef, targetEntityRef, optionIndex', () => {
		expect(createSessionFromIntentSchema.required).toContain('sourceEntityRef')
		expect(createSessionFromIntentSchema.required).toContain('targetEntityRef')
		expect(createSessionFromIntentSchema.required).toContain('optionIndex')
	})
})

describe('executeTool', () => {
	it('throws for unknown tool', async () => {
		await expect(executeTool('unknownTool', {}, {})).rejects.toThrow('Unknown tool')
	})

	it('resolveIntent returns matched intent with options', async () => {
		const result = await executeResolveIntent({
			sourceEntityRef: {
				entityType: EntityType.ActorCoin,
				entityId: { chainId: 1, address: '0xabc', tokenAddress: '0xdef' },
			},
			targetEntityRef: {
				entityType: EntityType.ActorNetwork,
				entityId: { chainId: 10, address: '0x123' },
			},
		})
		expect(result).toHaveProperty('matched', true)
		if (!result.matched) return
		expect(result.options.length).toBeGreaterThanOrEqual(1)
		expect(result.options[0]).toHaveProperty('name')
		expect(result.options[0]).toHaveProperty('sessionTemplate')
		expect(result.options[0].sessionTemplate).toHaveProperty('actions')
	})

	it('resolveIntent returns matched:false for no-match entity pair', async () => {
		const result = await executeResolveIntent({
			sourceEntityRef: {
				entityType: EntityType.Actor,
				entityId: { address: '0xaaa' },
			},
			targetEntityRef: {
				entityType: EntityType.UniswapPool,
				entityId: { poolId: '0xpool' },
			},
		})
		expect(result).toHaveProperty('matched', false)
	})
})

describe('executeCreateSessionFromIntent', () => {
	it('calls createSession and goto when intent resolves', async () => {
		mockCreateSession.mockClear()
		mockGoto.mockClear()

		const result = await executeCreateSessionFromIntent({
			sourceEntityRef: {
				entityType: EntityType.ActorCoin,
				entityId: { chainId: 1, address: '0xabc', tokenAddress: '0xdef' },
			},
			targetEntityRef: {
				entityType: EntityType.ActorNetwork,
				entityId: { chainId: 10, address: '0x123' },
			},
			optionIndex: 0,
		})

		expect(result).toEqual({ sessionId: 'mock-session-id', path: '/session/mock-session-id' })
		expect(mockCreateSession).toHaveBeenCalledWith(
			expect.objectContaining({
				name: expect.any(String),
				actions: expect.any(Array),
			}),
		)
		expect(mockGoto).toHaveBeenCalledWith('/session/mock-session-id', { replaceState: false })
	})

	it('returns error when no matching intent', async () => {
		const result = await executeCreateSessionFromIntent({
			sourceEntityRef: {
				entityType: EntityType.Actor,
				entityId: { address: '0xaaa' },
			},
			targetEntityRef: {
				entityType: EntityType.UniswapPool,
				entityId: { poolId: '0xpool' },
			},
			optionIndex: 0,
		})

		expect(result).toHaveProperty('error')
	})
})
