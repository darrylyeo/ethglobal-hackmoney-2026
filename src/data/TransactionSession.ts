import type { ActionSessionAction } from '$/constants/intents.ts'

export type TransactionSessionStatus = 'Draft' | 'Submitted' | 'Finalized'

export type TransactionSessionAction =
	| ActionSessionAction
	| 'liquidity'
	| 'intent'

export type TransactionSessionSimulationSummary = {
	forkMetadata: { blockNumber: number; rpcUrl: string; timestamp?: number }
	summaryStatus: 'success' | 'revert' | 'error'
	gasTotals: { used: string; refund?: string },
}

export type TransactionSession = {
	id: string
	actions: TransactionSessionAction[]
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

