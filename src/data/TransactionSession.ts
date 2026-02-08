import type { ActionType } from '$/constants/intents.ts'
import type { TevmSimulationSummaryStatus } from '$/data/TevmSimulationResult.ts'

export enum TransactionSessionStatus {
	Draft = 'Draft',
	Submitted = 'Submitted',
	Finalized = 'Finalized',
}

export type TransactionSessionAction = ActionType | 'liquidity' | 'intent'

export type SessionAction = {
	type: TransactionSessionAction
	params: Record<string, unknown>
}

export const sessionActionType = (action: SessionAction | TransactionSessionAction) =>
	typeof action === 'string' ? action : action.type

export const toSessionAction = (action: SessionAction | TransactionSessionAction): SessionAction =>
	typeof action === 'string' ? { type: action, params: {} } : action

export const createSessionAction = (type: TransactionSessionAction): SessionAction => ({
	type,
	params: {},
})

export type TransactionSessionSimulationSummary = {
	forkMetadata: { blockNumber: number; rpcUrl: string; timestamp?: number }
	summaryStatus: TevmSimulationSummaryStatus
	gasTotals: { used: string; refund?: string },
}

export type TransactionSession = {
	id: string
	name?: string
	actions: SessionAction[]
	status: TransactionSessionStatus
	createdAt: number
	updatedAt: number
	lockedAt?: number
	params: Record<string, unknown>
	latestSimulationId?: string
	simulationCount?: number
	simulation?: TransactionSessionSimulationSummary
	execution?: {
		submittedAt: number
		txHash?: `0x${string}`
		chainId?: number,
	}
	finalization?: {
		at: number
		receipt?: Record<string, unknown>,
	},
}

