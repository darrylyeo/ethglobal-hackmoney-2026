export type TransactionSessionStatus =
	| 'Draft'
	| 'Submitted'
	| 'Finalized'

export type TransactionSessionFlow =
	| 'swap'
	| 'bridge'
	| 'transfer'
	| 'liquidity'
	| 'intent'

export type TransactionSession = {
	id: string
	flows: TransactionSessionFlow[]
	status: TransactionSessionStatus
	createdAt: number
	updatedAt: number
	lockedAt?: number
	params: Record<string, unknown>
	latestSimulationId?: string
	simulationCount?: number
	execution?: {
		submittedAt: number
		txHash?: `0x${string}`
		chainId?: number
	}
	finalization?: {
		at: number
		receipt?: Record<string, unknown>
	}
}
