import {
	ActionType,
	actionTypeDefinitionByActionType,
	type Action,
	type ActionParams,
	type BridgeParams,
	type SessionDefaults,
	type SwapParams,
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

/** Validates action params for the given type; throws with arktype error message if invalid. Use at form submit. */
export const assertActionParams = <T extends ActionType>(
	type: T,
	params: unknown,
): ActionParams<T> => {
	const def = actionTypeDefinitionByActionType[type]
	const base = def.getDefaultParams() as Record<string, unknown>
	const record = toRecord(params)
	const merged = { ...base, ...(record ?? {}) } as Record<string, unknown>
	return def.params.assert(merged) as ActionParams<T>
}

/** Returns arktype-validated params for the given type, or null if invalid. Use to pass typed params to quote components and request keys. */
export function getValidatedActionParams(
	type: ActionType.Swap,
	params: unknown,
): SwapParams | null
export function getValidatedActionParams(
	type: ActionType.Bridge,
	params: unknown,
): BridgeParams | null
export function getValidatedActionParams<T extends ActionType>(
	type: T,
	params: unknown,
): ActionParams<T> | null
export function getValidatedActionParams<T extends ActionType>(
	type: T,
	params: unknown,
): ActionParams<T> | null {
	const def = actionTypeDefinitionByActionType[type]
	const base = def.getDefaultParams() as Record<string, unknown>
	const record = toRecord(params)
	const merged = { ...base, ...(record ?? {}) } as Record<string, unknown>
	return def.params.allows(merged) ? (def.params.assert(merged) as ActionParams<T>) : null
}
