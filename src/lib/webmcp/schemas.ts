/** JSON Schema 2020-12 definitions for WebMCP tool inputs */

export const createSessionSchema = {
	type: 'object',
	properties: {
		template: {
			type: 'string',
			enum: [
				'Swap',
				'Bridge',
				'Transfer',
				'AddLiquidity',
				'RemoveLiquidity',
				'CollectFees',
				'IncreaseLiquidity',
			],
		},
		actions: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					action: { type: 'string' },
					params: { type: 'object' },
				},
			},
		},
		persist: { type: 'boolean', default: true },
	},
} as const

export const sessionIdSchema = {
	type: 'object',
	properties: { sessionId: { type: 'string' } },
	required: ['sessionId'],
} as const

export const updateSessionParamsSchema = {
	type: 'object',
	properties: {
		sessionId: { type: 'string' },
		params: { type: 'object' },
	},
	required: ['sessionId', 'params'],
} as const

export const navigateSchema = {
	type: 'object',
	properties: {
		path: { type: 'string' },
		params: { type: 'object' },
		replace: { type: 'boolean', default: false },
		target: {
			type: 'string',
			enum: ['page', 'panel'],
			default: 'page',
		},
	},
	required: ['path'],
} as const

export const entityRefSchema = {
	type: 'object',
	properties: {
		entityType: { type: 'string' },
		entityId: { anyOf: [{ type: 'string' }, { type: 'object' }] },
	},
	required: ['entityType', 'entityId'],
} as const

export const watchEntitySchema = {
	...entityRefSchema,
	required: ['entityType', 'entityId'],
} as const

export const unwatchEntitySchema = { ...entityRefSchema } as const

export const dashboardIdSchema = {
	type: 'object',
	properties: { dashboardId: { type: 'string' } },
	required: ['dashboardId'],
} as const

export const renameDashboardSchema = {
	type: 'object',
	properties: {
		dashboardId: { type: 'string' },
		name: { type: 'string' },
	},
	required: ['dashboardId', 'name'],
} as const

export const setPanelRouteSchema = {
	type: 'object',
	properties: {
		dashboardId: { type: 'string' },
		panelId: { type: 'string' },
		path: { type: 'string' },
		params: { type: 'object' },
	},
	required: ['dashboardId', 'panelId', 'path'],
} as const

export const splitPanelSchema = {
	type: 'object',
	properties: {
		dashboardId: { type: 'string' },
		panelId: { type: 'string' },
		direction: { type: 'string', enum: ['horizontal', 'vertical'] },
		ratio: { type: 'number' },
		newPanelRoute: {
			type: 'object',
			properties: {
				path: { type: 'string' },
				params: { type: 'object' },
			},
		},
	},
	required: ['dashboardId', 'panelId', 'direction', 'newPanelRoute'],
} as const

export const setFocusSchema = {
	type: 'object',
	properties: {
		dashboardId: { type: 'string' },
		panelId: { type: 'string' },
	},
	required: ['dashboardId', 'panelId'],
} as const

export const resolveIntentSchema = {
	type: 'object',
	properties: {
		sourceEntityRef: entityRefSchema,
		targetEntityRef: entityRefSchema,
	},
	required: ['sourceEntityRef', 'targetEntityRef'],
} as const

export const createSessionFromIntentSchema = {
	type: 'object',
	properties: {
		sourceEntityRef: entityRefSchema,
		targetEntityRef: entityRefSchema,
		optionIndex: { type: 'number', minimum: 0 },
	},
	required: ['sourceEntityRef', 'targetEntityRef', 'optionIndex'],
} as const
