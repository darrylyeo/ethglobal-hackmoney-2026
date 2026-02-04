export type TransactionSessionSimulationStatus = 'success' | 'failed'

export type TransactionSessionSimulation = {
	id: string
	sessionId: string
	status: TransactionSessionSimulationStatus
	createdAt: number
	paramsHash: string
	result: unknown | null
	error?: string
}
