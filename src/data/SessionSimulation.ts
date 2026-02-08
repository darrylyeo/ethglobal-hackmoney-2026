export enum SessionSimulationStatus {
	Success = 'success',
	Failed = 'failed',
}

export type SessionSimulation = {
	id: string,
	sessionId: string,
	status: SessionSimulationStatus,
	createdAt: number,
	paramsHash: string,
	result: unknown | null,
	error?: string,
}
