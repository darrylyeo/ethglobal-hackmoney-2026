import { sessionActionsCollection } from '$/collections/SessionActions.ts'
import { sessionSimulationsCollection } from '$/collections/SessionSimulations.ts'
import { sessionsCollection } from '$/collections/Sessions.ts'
import {
	type Action,
	type Session,
	SessionStatus,
} from '$/data/Session.ts'
import {
	actionTypeDefinitionByActionType,
	createAction,
} from '$/constants/actions.ts'
import { ActionType } from '$/constants/actions.ts'
import { type SessionSimulationStatus } from '$/data/SessionSimulation.ts'
import { specForAction, validActionTypes } from '$/lib/intents.ts'
import { type SessionDefaults } from '$/constants/actions.ts'
import { normalizeSessionParams } from '$/lib/session/params.ts'
import { stringify } from '$/lib/stringify.ts'

export type SessionHashResult =
	| {
			kind: 'empty',
	  }
	| {
			kind: 'session',
			sessionId: string,
	  }
	| {
			kind: 'actions',
			actions: {
				action: Action['type'],
				params: Record<string, unknown> | null,
			}[],
	  }

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

export const buildSessionHash = (sessionId: string) => `#/session:${sessionId}`

export const parseTemplateParam = (template: string | null): SessionHashResult => {
	if (!template || !validActionTypes.has(template as Action['type']))
		return { kind: 'empty' }
	return {
		kind: 'actions',
		actions: [{ action: template as Action['type'], params: null }],
	}
}

export const parseSessionHash = (hash: string): SessionHashResult => {
	const normalized = hash.startsWith('#/') ? hash.slice(2) : hash.startsWith('#') ? hash.slice(1) : hash
	if (!normalized) return { kind: 'empty' }
	if (normalized.startsWith('session:')) {
		const sessionId = normalized.slice('session:'.length)
		return sessionId ? { kind: 'session', sessionId } : { kind: 'empty' }
	}
	const actions = normalized
		.split('|')
		.filter((entry) => entry.trim().length > 0)
		.map((entry) => {
			const separatorIndex = entry.indexOf(':')
			const action = (
				separatorIndex === -1 ? entry : entry.slice(0, separatorIndex)
			).trim() as Action['type']
			if (!validActionTypes.has(action))
				return null
			if (separatorIndex === -1) {
				return {
					action,
					params: null,
				}
			}
			const paramsSource = entry.slice(separatorIndex + 1).trim()
			if (!paramsSource) {
				return {
					action,
					params: null,
				}
			}
			try {
				const parsed = JSON.parse(decodeURIComponent(paramsSource))
				return {
					action,
					params: isRecord(parsed) ? parsed : null,
				}
			} catch {
				return {
					action,
					params: null,
				}
			}
		})
		.flatMap((entry) => (entry ? [entry] : []))
	return actions.length > 0 ? { kind: 'actions', actions } : { kind: 'empty' }
}

export const formatSessionPlaceholderName = (actions: Action[]): string => {
	const labels = actions
		.map((a) => (actionTypeDefinitionByActionType as Record<string, { label: string }>)[a.type]?.label)
		.filter(Boolean) as string[]
	return labels.length > 0 ? labels.join(' → ') : 'Session'
}

export const sessionFromParsedHash = (parsed: SessionHashResult): Session => {
	const now = Date.now()
	const actions: Action[] =
		parsed.kind === 'empty'
			? [createAction(ActionType.Swap)]
			: parsed.kind === 'actions'
				? parsed.actions.map((a) =>
						createAction(a.action, (a.params ?? undefined) as Record<string, unknown>),
					)
				: [createAction(ActionType.Swap)]
	const params = normalizeSessionParams(
		actions,
		actions[0]?.params ?? {},
	)
	return {
		id: `ephemeral-${createSessionId()}`,
		actions,
		status: SessionStatus.Draft,
		createdAt: now,
		updatedAt: now,
		params,
	}
}

export const createSessionId = () =>
	globalThis.crypto?.randomUUID
		? globalThis.crypto.randomUUID()
		: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export const getSessionActions = (sessionId: string): Action[] => {
	const rows = [...sessionActionsCollection.state.values()]
		.filter((row) => row.sessionId === sessionId)
		.sort((a, b) => a.actionIndex - b.actionIndex)
	return rows.map((row) => row.action)
}

export const setSessionActions = (sessionId: string, actions: Action[]) => {
	for (const [id, row] of sessionActionsCollection.state) {
		if (row.sessionId === sessionId) sessionActionsCollection.delete(id)
	}
	actions.forEach((action, actionIndex) => {
		sessionActionsCollection.insert({
			id: createSessionId(),
			sessionId,
			actionIndex,
			action,
		})
	})
}

export const createSession = (args: {
	actions: (Action | Action['type'])[]
	name?: string
	params?: Record<string, unknown>
	status?: SessionStatus
	defaults?: SessionDefaults
}) => createSessionWithId(createSessionId(), args)

export const createSessionWithId = (
	id: string,
	args: {
		actions: (Action | Action['type'])[]
		name?: string
		params?: Record<string, unknown>
		status?: SessionStatus
		defaults?: SessionDefaults
	},
) => {
	const now = Date.now()
	const sessionActions = args.actions.map((a) =>
		typeof a === 'string' ? createAction(a) : a,
	)
	const normalizedParams = normalizeSessionParams(
		sessionActions,
		args.params ?? (sessionActions[0]?.params ?? {}) as Record<string, unknown>,
		args.defaults,
	)
	const session: Session = {
		id,
		name: args.name,
		actions: sessionActions,
		status: args.status ?? SessionStatus.Draft,
		createdAt: now,
		updatedAt: now,
		params: normalizedParams,
	}
	sessionsCollection.insert(session)
	setSessionActions(id, sessionActions)
	return session
}

export const getSession = (sessionId: string): Session | null => {
	const row = sessionsCollection.state.get(sessionId) ?? null
	if (!row) return null
	const actionsFromCollection = getSessionActions(sessionId)
	const actions =
		actionsFromCollection.length > 0 ? actionsFromCollection : row.actions
	return { ...row, actions }
}

export const updateSession = (
	sessionId: string,
	update: (session: Session) => Session,
) => {
	const current = getSession(sessionId)
	if (!current) return
	const next = update({
		...current,
		params: { ...current.params },
	})
	setSessionActions(sessionId, next.actions)
	sessionsCollection.update(sessionId, (draft) => {
		draft.actions = next.actions
		draft.name = next.name
		draft.status = next.status
		draft.createdAt = next.createdAt ?? draft.createdAt ?? Date.now()
		draft.updatedAt = Date.now()
		draft.lockedAt = next.lockedAt
		draft.params = next.params
		draft.latestSimulationId = next.latestSimulationId
		draft.simulationCount = next.simulationCount
		draft.execution = next.execution
		draft.finalization = next.finalization
	})
}

export const updateSessionParams = (
	sessionId: string,
	params: Record<string, unknown>,
	defaults?: SessionDefaults,
) =>
	updateSession(sessionId, (session) => ({
		...session,
		params: normalizeSessionParams(session.actions, params, defaults),
		updatedAt: Date.now(),
	}))

export const lockSession = (sessionId: string) =>
	updateSession(sessionId, (session) => ({
		...session,
		lockedAt: session.lockedAt ?? Date.now(),
		updatedAt: Date.now(),
	}))

export const markSessionSubmitted = (
	sessionId: string,
	execution: Session['execution'],
) =>
	updateSession(sessionId, (session) => ({
		...session,
		status: SessionStatus.Submitted,
		execution,
		updatedAt: Date.now(),
	}))

export const markSessionFinalized = (
	sessionId: string,
	finalization: Session['finalization'],
) =>
	updateSession(sessionId, (session) => ({
		...session,
		status: SessionStatus.Finalized,
		finalization,
		updatedAt: Date.now(),
	}))

export const deleteSession = (sessionId: string) => {
	for (const [id, row] of sessionActionsCollection.state) {
		if (row.sessionId === sessionId) sessionActionsCollection.delete(id)
	}
	for (const [id, row] of sessionSimulationsCollection.state) {
		if (row.sessionId === sessionId)
			sessionSimulationsCollection.delete(id)
	}
	sessionsCollection.delete(sessionId)
}

export const deleteAllDraftSessions = () => {
	for (const [id, row] of sessionsCollection.state) {
		if (row.status === SessionStatus.Draft)
			deleteSession(id)
	}
}

export const forkSession = (session: Session) =>
	createSession({
		actions: [...session.actions],
		params: { ...session.params },
	})

export const createSessionSimulation = (args: {
	sessionId: string
	params: Record<string, unknown>
	status: SessionSimulationStatus
	result: unknown | null
	error?: string
}) => {
	const createdAt = Date.now()
	const simulationId = createSessionId()
	sessionSimulationsCollection.insert({
		id: simulationId,
		sessionId: args.sessionId,
		status: args.status,
		createdAt,
		paramsHash: stringify(args.params),
		result: args.result,
		error: args.error,
	})
	return simulationId
}

