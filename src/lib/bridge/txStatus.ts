export enum TxStep {
	Approve = 'approve',
	Send = 'send',
	Confirm = 'confirm',
	Complete = 'complete',
}

export enum TxState {
	Pending = 'pending',
	Success = 'success',
	Failed = 'failed',
}

export type TxStatus = {
	step: TxStep
	state: TxState
	txHash?: string
	chainId?: number
	error?: string
	startedAt: number
	completedAt?: number
}

export enum BridgeOverallStatus {
	Idle = 'idle',
	InProgress = 'in_progress',
	Completed = 'completed',
	Failed = 'failed',
}

export type BridgeStatus = {
	overall: BridgeOverallStatus
	steps: TxStatus[]
	estimatedDurationSeconds?: number
}

export const createInitialStatus = (): BridgeStatus => ({
	overall: BridgeOverallStatus.Idle,
	steps: [],
})

export const mapLifiProcessStatus = (
	processType: string,
	status: string,
): { step: TxStep; state: TxState } => {
	const step: TxStep =
		processType === 'TOKEN_ALLOWANCE' || processType === 'PERMIT'
			? TxStep.Approve
			: processType === 'SWAP' || processType === 'CROSS_CHAIN'
				? TxStep.Send
				: processType === 'RECEIVING_CHAIN'
					? TxStep.Confirm
					: TxStep.Send
	const state: TxState =
		status === 'DONE' ?
			TxState.Success
		: status === 'FAILED' ?
			TxState.Failed
		:
			TxState.Pending
	return { step, state }
}

