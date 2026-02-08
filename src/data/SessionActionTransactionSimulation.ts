export enum SessionActionSimulationStatus {
	Success = 'success',
	Failed = 'failed',
}

export type SessionActionTransactionSimulation = {
	id: string
	sessionId: string
	actionIndex: number
	status: SessionActionSimulationStatus
	createdAt: number
	paramsHash: string
	result: unknown | null
	error?: string
}
