import { transactionSessionSimulationsCollection } from '$/collections/transaction-session-simulations.ts'
import { transactionSessionsCollection } from '$/collections/transaction-sessions.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type {
	TransactionSession,
	TransactionSessionAction,
	TransactionSessionStatus,
} from '$/data/TransactionSession.ts'
import type { TransactionSessionSimulationStatus } from '$/data/TransactionSessionSimulation.ts'
import {
	normalizeTransactionSessionParams,
	type TransactionSessionDefaults,
} from '$/lib/session/params.ts'
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
				action: TransactionSessionAction,
				params: Record<string, unknown> | null,
			}[],
	  }

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

export const buildSessionHash = (sessionId: string) => `#session:${sessionId}`

export const parseSessionHash = (hash: string): SessionHashResult => {
	const normalized = hash.startsWith('#') ? hash.slice(1) : hash
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
			).trim() as TransactionSessionAction
			if (
				action !== 'swap' &&
				action !== 'bridge' &&
				action !== 'transfer' &&
				action !== 'liquidity' &&
				action !== 'createChannel' &&
				action !== 'addChannelMember' &&
				action !== 'closeChannel' &&
				action !== 'addLiquidity' &&
				action !== 'removeLiquidity' &&
				action !== 'collectFees' &&
				action !== 'increaseLiquidity' &&
				action !== 'shareAddress' &&
				action !== 'proposeTransfer' &&
				action !== 'requestVerification' &&
				action !== 'depositToCustody' &&
				action !== 'withdrawFromCustody' &&
				action !== 'resizeChannel' &&
				action !== 'createPool' &&
				action !== 'acceptTransfer' &&
				action !== 'rejectTransfer' &&
				action !== 'intent'
			)
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

export const createSessionId = () =>
	globalThis.crypto?.randomUUID
		? globalThis.crypto.randomUUID()
		: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export const createTransactionSession = (args: {
	actions: TransactionSessionAction[]
	params: Record<string, unknown>
	status?: TransactionSessionStatus
	defaults?: TransactionSessionDefaults
}) => createTransactionSessionWithId(createSessionId(), args)

export const createTransactionSessionWithId = (
	id: string,
	args: {
		actions: TransactionSessionAction[]
		params: Record<string, unknown>
		status?: TransactionSessionStatus
		defaults?: TransactionSessionDefaults
	},
) => {
	const now = Date.now()
	const normalizedParams = normalizeTransactionSessionParams(
		args.actions,
		args.params,
		args.defaults,
	)
	const session: TransactionSession = {
		id,
		actions: args.actions,
		status: args.status ?? 'Draft',
		createdAt: now,
		updatedAt: now,
		params: normalizedParams,
	}
	transactionSessionsCollection.insert({
		...session,
		$source: DataSource.Local,
	})
	return session
}

export const getTransactionSession = (sessionId: string) =>
	transactionSessionsCollection.state.get(sessionId) ?? null

export const updateTransactionSession = (
	sessionId: string,
	update: (session: TransactionSession) => TransactionSession,
) => {
	const current = getTransactionSession(sessionId)
	if (!current) return
	transactionSessionsCollection.update(sessionId, (draft) => {
		const next = update({
			...current,
			params: { ...current.params },
		})
		draft.actions = next.actions
		draft.status = next.status
		draft.createdAt = next.createdAt
		draft.updatedAt = next.updatedAt
		draft.lockedAt = next.lockedAt
		draft.params = next.params
		draft.latestSimulationId = next.latestSimulationId
		draft.simulationCount = next.simulationCount
		draft.execution = next.execution
		draft.finalization = next.finalization
	})
}

export const updateTransactionSessionParams = (
	sessionId: string,
	params: Record<string, unknown>,
	defaults?: TransactionSessionDefaults,
) =>
	updateTransactionSession(sessionId, (session) => ({
		...session,
		params: normalizeTransactionSessionParams(
			session.actions,
			params,
			defaults,
		),
		updatedAt: Date.now(),
	}))

export const lockTransactionSession = (sessionId: string) =>
	updateTransactionSession(sessionId, (session) => ({
		...session,
		lockedAt: session.lockedAt ?? Date.now(),
		updatedAt: Date.now(),
	}))

export const markTransactionSessionSubmitted = (
	sessionId: string,
	execution: TransactionSession['execution'],
) =>
	updateTransactionSession(sessionId, (session) => ({
		...session,
		status: 'Submitted',
		execution,
		updatedAt: Date.now(),
	}))

export const markTransactionSessionFinalized = (
	sessionId: string,
	finalization: TransactionSession['finalization'],
) =>
	updateTransactionSession(sessionId, (session) => ({
		...session,
		status: 'Finalized',
		finalization,
		updatedAt: Date.now(),
	}))

export const deleteTransactionSession = (sessionId: string) => {
	for (const [id, row] of transactionSessionSimulationsCollection.state) {
		if (row.sessionId === sessionId)
			transactionSessionSimulationsCollection.delete(id)
	}
	transactionSessionsCollection.delete(sessionId)
}

export const forkTransactionSession = (session: TransactionSession) =>
	createTransactionSession({
		actions: [...session.actions],
		params: { ...session.params },
	})

export const createTransactionSessionSimulation = (args: {
	sessionId: string
	params: Record<string, unknown>
	status: TransactionSessionSimulationStatus
	result: unknown | null
	error?: string
}) => {
	const createdAt = Date.now()
	const simulationId = createSessionId()
	transactionSessionSimulationsCollection.insert({
		id: simulationId,
		sessionId: args.sessionId,
		status: args.status,
		createdAt,
		paramsHash: stringify(args.params),
		result: args.result,
		error: args.error,
		$source: DataSource.Local,
	})
	return simulationId
}

