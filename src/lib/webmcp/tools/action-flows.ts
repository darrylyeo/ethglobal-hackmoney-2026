import { goto } from '$app/navigation'

import { createAction } from '$/constants/actions.ts'
import {
	buildSessionPath,
	createSession,
	getSession,
	updateSessionParams,
} from '$/lib/session/sessions.ts'
import { setSessionCommand } from '$/state/session-command.svelte.ts'

import type {
	createSessionSchema,
	sessionIdSchema,
	updateSessionParamsSchema,
} from '$/lib/webmcp/schemas.ts'

type CreateSessionInput = (typeof createSessionSchema) extends { properties: infer P }
	? { [K in keyof P]?: unknown }
	: never
type SessionIdInput = (typeof sessionIdSchema) extends { properties: infer P }
	? { [K in keyof P]: unknown }
	: never
type UpdateSessionParamsInput = (typeof updateSessionParamsSchema) extends {
	properties: infer P
}
	? { [K in keyof P]: unknown }
	: never

const coerceBigint = (v: unknown): bigint | unknown =>
	typeof v === 'bigint' ? v : typeof v === 'string' || typeof v === 'number' ? BigInt(String(v)) : v
const spreadDefined = (o: Record<string, unknown>) =>
	Object.fromEntries(Object.entries(o).filter(([, v]) => v != null))
const coerceParams = (params: Record<string, unknown>) =>
	Object.fromEntries(
		Object.entries(params).map(([k, v]) =>
			['amount', 'amount0', 'amount1'].includes(k) ? [k, coerceBigint(v)] : [k, v],
		),
	)

export const executeCreateSession = async (input: CreateSessionInput) => {
	const template = (input.template as string) ?? 'Swap'
	const actionsRaw = (input.actions as { action: string; params?: Record<string, unknown> }[]) ?? [
		{ action: template, params: null },
	]
	const persist = (input.persist as boolean) ?? true

	const actions = actionsRaw.map((a) =>
		createAction(a.action as 'Swap', a.params ? coerceParams(spreadDefined(a.params)) : undefined),
	)
	const session = createSession({ actions, params: {} })

	if (persist) {
		await goto(buildSessionPath(session.$id.id), { replaceState: false })
		return { sessionId: session.$id.id, path: buildSessionPath(session.$id.id) }
	}
	return { sessionId: session.$id.id, ephemeral: true }
}

export const executeUpdateSessionParams = async (input: UpdateSessionParamsInput) => {
	const sessionId = input.sessionId as string
	const params = coerceParams(spreadDefined((input.params as Record<string, unknown>) ?? {}))
	updateSessionParams(sessionId, params)
	return { sessionId, updated: true }
}

export const executeGetSession = async (input: SessionIdInput) => {
	const session = getSession(input.sessionId as string)
	if (!session) return { error: 'Session not found' }
	return {
		id: session.$id.id,
		name: session.name,
		status: session.status,
		actions: session.actions,
		params: JSON.parse(
			JSON.stringify(session.params, (_, v) =>
				typeof v === 'bigint' ? v.toString() : v,
			),
		),
	}
}

export const executeSimulateSession = async (
	input: SessionIdInput,
	requestUserInteraction?: (cb: () => Promise<unknown>) => Promise<unknown>,
) => {
	const sessionId = input.sessionId as string
	if (!getSession(sessionId)) return { error: 'Session not found' }
	const promise = setSessionCommand(sessionId, 'simulate')
	await goto(buildSessionPath(sessionId), { replaceState: false })
	if (requestUserInteraction) await requestUserInteraction(() => promise)
	else await promise
	return { sessionId, simulated: true }
}

export const executeExecuteSession = async (
	input: SessionIdInput,
	requestUserInteraction?: (cb: () => Promise<unknown>) => Promise<unknown>,
) => {
	const sessionId = input.sessionId as string
	if (!getSession(sessionId)) return { error: 'Session not found' }
	const promise = setSessionCommand(sessionId, 'execute')
	await goto(buildSessionPath(sessionId), { replaceState: false })
	if (requestUserInteraction) await requestUserInteraction(() => promise)
	else await promise
	return { sessionId, executed: true }
}
