export enum SessionActionSimulationStatus {
	Success = 'success',
	Failed = 'failed',
}

export type SessionActionTransactionSimulation = {
	id: string
	sessionId: string
	indexInSequence: number
	status: SessionActionSimulationStatus
	createdAt: number
	paramsHash: string
	result: unknown | null
	error?: string
}
