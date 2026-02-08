import {
	ActionType,
	actionTypeDefinitionByActionType,
	type Action,
	type ActionParams,
	type SessionDefaults,
} from '$/constants/actions.ts'

const toRecord = (v: unknown): Record<string, unknown> | null =>
	v != null && typeof v === 'object' && !Array.isArray(v)
		? (v as Record<string, unknown>)
		: null

export const normalizeActionParams = <T extends ActionType>(
	type: T,
	params: unknown,
	defaults?: SessionDefaults,
): ActionParams<T> => {
	const def = actionTypeDefinitionByActionType[type]
	const base =
		(defaults && (defaults as Record<ActionType, unknown>)[type]) ??
		def.getDefaultParams()
	const record = toRecord(params)
	const merged = { ...base, ...(record ?? {}) } as Record<string, unknown>
	try {
		return def.params.assert(merged) as ActionParams<T>
	} catch {
		return base as ActionParams<T>
	}
}

export const normalizeSessionParams = (
	actions: Action[],
	params: Record<string, unknown> | null,
	defaults?: SessionDefaults,
) =>
	actions[0]
		? normalizeActionParams(actions[0].type, params, defaults)
		: (params ?? {})

export const getActionParams = <T extends ActionType>(
	session: { params?: unknown } | null,
	type: T,
	defaults?: SessionDefaults,
): ActionParams<T> =>
	normalizeActionParams(type, session?.params ?? null, defaults)
