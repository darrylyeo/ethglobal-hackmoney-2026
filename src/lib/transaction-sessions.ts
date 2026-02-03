import { transactionSessionSimulationsCollection } from '$/collections/transaction-session-simulations'
import { transactionSessionsCollection } from '$/collections/transaction-sessions'
import { DataSource } from '$/constants/data-sources'
import type {
	TransactionSession,
	TransactionSessionFlow,
	TransactionSessionStatus,
} from '$/data/TransactionSession'
import type {
	TransactionSessionSimulationStatus,
} from '$/data/TransactionSessionSimulation'
import { stringify } from '$/lib/stringify'

export type SessionHashResult =
	| {
			kind: 'empty'
	  }
	| {
			kind: 'session'
			sessionId: string
	  }
	| {
			kind: 'params'
			params: Record<string, unknown>
	  }

const isRecord = (value: unknown): value is Record<string, unknown> => (
	typeof value === 'object' && value !== null && !Array.isArray(value)
)

export const buildSessionHash = (sessionId: string) => (
	`#session:${sessionId}`
)

export const parseSessionHash = (hash: string): SessionHashResult => {
	const normalized = hash.startsWith('#') ? hash.slice(1) : hash
	if (!normalized) return { kind: 'empty' }
	if (normalized.startsWith('session:')) {
		const sessionId = normalized.slice('session:'.length)
		return sessionId ? { kind: 'session', sessionId } : { kind: 'empty' }
	}
	try {
		const parsed = JSON.parse(decodeURIComponent(normalized))
		return isRecord(parsed) ? { kind: 'params', params: parsed } : { kind: 'empty' }
	} catch {
		return { kind: 'empty' }
	}
}

export const createSessionId = () => (
	globalThis.crypto?.randomUUID
		? globalThis.crypto.randomUUID()
		: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
)

export const createTransactionSession = (args: {
	flows: TransactionSessionFlow[]
	params: Record<string, unknown>
	status?: TransactionSessionStatus
}) => {
	const now = Date.now()
	const session: TransactionSession = {
		id: createSessionId(),
		flows: args.flows,
		status: args.status ?? 'Draft',
		createdAt: now,
		updatedAt: now,
		params: args.params,
	}
	transactionSessionsCollection.insert({
		...session,
		$source: DataSource.Local,
	})
	return session
}

export const getTransactionSession = (sessionId: string) => (
	transactionSessionsCollection.state.get(sessionId) ?? null
)

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
		draft.flows = next.flows
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
) => (
	updateTransactionSession(sessionId, (session) => ({
		...session,
		params,
		updatedAt: Date.now(),
	}))
)

export const lockTransactionSession = (sessionId: string) => (
	updateTransactionSession(sessionId, (session) => ({
		...session,
		lockedAt: session.lockedAt ?? Date.now(),
		updatedAt: Date.now(),
	}))
)

export const markTransactionSessionSubmitted = (
	sessionId: string,
	execution: TransactionSession['execution'],
) => (
	updateTransactionSession(sessionId, (session) => ({
		...session,
		status: 'Submitted',
		execution,
		updatedAt: Date.now(),
	}))
)

export const markTransactionSessionFinalized = (
	sessionId: string,
	finalization: TransactionSession['finalization'],
) => (
	updateTransactionSession(sessionId, (session) => ({
		...session,
		status: 'Finalized',
		finalization,
		updatedAt: Date.now(),
	}))
)

export const forkTransactionSession = (session: TransactionSession) => (
	createTransactionSession({
		flows: [...session.flows],
		params: { ...session.params },
	})
)

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
