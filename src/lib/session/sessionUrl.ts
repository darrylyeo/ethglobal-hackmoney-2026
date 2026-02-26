/**
 * SSR-safe session URL parsing. No collection imports (localStorage).
 */
import {
	actionTypeDefinitionByActionType,
	ActionType,
	createAction,
	mergeActionParams,
	type Action,
} from '$/constants/actions.ts'
import {
	SessionTemplateId,
	sessionTemplatesById,
	type Session,
	SessionStatus,
} from '$/data/Session.ts'
import { validActionTypes } from '$/lib/intents.ts'
import { normalizeSessionParams } from '$/lib/session/params.ts'
import { parse } from 'devalue'

export type SessionHashResult =
	| { kind: 'empty' }
	| { kind: 'session'; sessionId: string }
	| {
			kind: 'actions'
			actions: {
				action: Action['type']
				params: Record<string, unknown> | null
			}[]
	  }

export type SessionInput = {
	template: string | null
	session: Session | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const createEphemeralId = () =>
	globalThis.crypto?.randomUUID?.() ??
	`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const toPascalAction = (raw: string): string =>
	raw.charAt(0).toUpperCase() + raw.slice(1)

export const parseTemplateParam = (template: string | null): SessionHashResult => {
	if (!template || !validActionTypes.has(template as Action['type']))
		return { kind: 'empty' }
	return {
		kind: 'actions',
		actions: [{ action: template as Action['type'], params: null }],
	}
}

export const parseSessionActions = (input: string): SessionHashResult => {
	const normalized = input.startsWith('#/')
		? input.slice(2)
		: input.startsWith('#')
			? input.slice(1)
			: input
	if (!normalized.trim()) return { kind: 'empty' }
	const actions = normalized
		.split('|')
		.filter((entry) => entry.trim().length > 0)
		.map((entry) => {
			const separatorIndex = entry.indexOf(':')
			const rawAction = (
				separatorIndex === -1 ? entry : entry.slice(0, separatorIndex)
			).trim()
			const action = (
				validActionTypes.has(rawAction as Action['type'])
					? rawAction
					: toPascalAction(rawAction)
			) as Action['type']
			if (!validActionTypes.has(action)) return null
			if (separatorIndex === -1)
				return { action, params: null }
			const paramsSource = entry.slice(separatorIndex + 1).trim()
			if (!paramsSource) return { action, params: null }
			try {
				const parsed = JSON.parse(decodeURIComponent(paramsSource))
				return {
					action,
					params: isRecord(parsed) ? parsed : null,
				}
			} catch {
				return { action, params: null }
			}
		})
		.flatMap((entry) => (entry ? [entry] : []))
	return actions.length > 0 ? { kind: 'actions', actions } : { kind: 'empty' }
}

export const parseSessionStateFromUrl = (
	searchParams: URLSearchParams,
): SessionHashResult => {
	const templateParam = searchParams.get('template')
	const template =
		templateParam && validActionTypes.has(templateParam as Action['type'])
			? templateParam
			: templateParam
				? toPascalAction(templateParam)
				: null
	const actionsParam = searchParams.get('actions')
	if (template && validActionTypes.has(template as Action['type']))
		return parseTemplateParam(template)
	if (actionsParam) return parseSessionActions(actionsParam)
	return { kind: 'empty' }
}

export const parseSessionStateFromHashLike = (
	hashLike: string,
): SessionHashResult => {
	const raw = hashLike.startsWith('#/')
		? hashLike.slice(2)
		: hashLike.startsWith('#')
			? hashLike.slice(1)
			: hashLike
	if (!raw.trim()) return { kind: 'empty' }
	try {
		const params = new URLSearchParams(raw)
		const template = params.get('template')
		const actions = params.get('actions')
		if (template) return parseTemplateParam(template)
		if (actions) return parseSessionActions(actions)
	} catch {
		//
	}
	return parseSessionActions(raw)
}

const sessionFromParsedHash = (parsed: SessionHashResult): Session => {
	const now = Date.now()
	const raw =
		parsed.kind === 'empty'
			? [createAction(ActionType.Swap)]
			: parsed.kind === 'actions'
				? parsed.actions.map((a) =>
						createAction(
							a.action,
							(a.params ?? undefined) as Record<string, unknown>,
						),
					)
				: [createAction(ActionType.Swap)]
	const actions = raw.map((a) => mergeActionParams(a))
	const params = normalizeSessionParams(
		actions,
		(actions[0]?.params ?? {}) as Record<string, unknown>,
	) as Record<string, unknown>
	return {
		$id: { id: `ephemeral-${createEphemeralId()}` },
		actions,
		status: SessionStatus.Draft,
		createdAt: now,
		updatedAt: now,
		params,
	}
}

const normalizeTemplate = (raw: string | null): string | null => {
	if (!raw?.trim()) return null
	const pascal = raw.charAt(0).toUpperCase() + raw.slice(1)
	return validActionTypes.has(pascal as Action['type']) ? pascal : null
}

export const getSessionInputFromUrl = (url: URL): SessionInput => {
	const sessionParam = url.searchParams.get('session')
	let session: Session | null = null
	if (sessionParam) {
		try {
			const parsed = parse(decodeURIComponent(sessionParam)) as Session
			if (parsed?.actions?.length) {
				session = {
					...parsed,
					$id: { id: `ephemeral-${createEphemeralId()}` },
					status: SessionStatus.Draft,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				}
			}
		} catch {
			//
		}
	}
	if (session) return { template: null, session }
	const templateParam = url.searchParams.get('template')
	const actionsParam = url.searchParams.get('actions')
	const template = normalizeTemplate(templateParam)
	const parsed =
		template
			? parseTemplateParam(template)
			: actionsParam
				? parseSessionActions(actionsParam)
				: parseSessionStateFromUrl(url.searchParams)
	if (parsed.kind !== 'actions' && parsed.kind !== 'empty')
		return { template: null, session: null }
	const base = sessionFromParsedHash(parsed)
	const tpl = template && sessionTemplatesById[template as SessionTemplateId]
	const raw =
		(tpl ? tpl.actions : base.actions).length > 0
			? (tpl ? tpl.actions : base.actions)
			: [createAction(ActionType.Swap)]
	return {
		template: templateParam ?? actionsParam ?? '',
		session: {
			...base,
			actions: raw.map((a) => mergeActionParams(a)),
		},
	}
}

export const sessionFromInput = (input: SessionInput): Session | null =>
	input.session

export const formatSessionPlaceholderName = (actions: Action[]): string => {
	const labels = actions
		.map(
			(a) =>
				(actionTypeDefinitionByActionType as Record<string, { label: string }>)[
					a.type
				]?.label,
		)
		.filter(Boolean) as string[]
	return labels.length > 0 ? labels.join(' → ') : 'Session'
}
