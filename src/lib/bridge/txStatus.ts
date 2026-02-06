export type TxStep = 'approve' | 'send' | 'confirm' | 'complete'

export type TxStatus = {
	step: TxStep
	state: 'pending' | 'success' | 'failed'
	txHash?: string
	chainId?: number
	error?: string
	startedAt: number
	completedAt?: number
}

export type BridgeStatus = {
	overall: 'idle' | 'in_progress' | 'completed' | 'failed'
	steps: TxStatus[]
	estimatedDurationSeconds?: number
}

export const createInitialStatus = (): BridgeStatus => ({
	overall: 'idle',
	steps: [],
})

export const mapLifiProcessStatus = (
	processType: string,
	status: string,
): { step: TxStep; state: TxStatus['state'] } => {
	const step: TxStep =
		processType === 'TOKEN_ALLOWANCE' || processType === 'PERMIT'
			? 'approve'
			: processType === 'SWAP' || processType === 'CROSS_CHAIN'
				? 'send'
				: processType === 'RECEIVING_CHAIN'
					? 'confirm'
					: 'send'
	const state: TxStatus['state'] =
		status === 'DONE' ?
			'success'
		: status === 'FAILED' ?
			'failed'
		:
			'pending'
	return { step, state }
}

