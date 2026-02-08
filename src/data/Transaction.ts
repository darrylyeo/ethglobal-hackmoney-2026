export type Transaction$Id = {
	address: `0x${string}`
	sourceTxHash: string
	createdAt: number
}

export enum BridgeTransactionStatus {
	Pending = 'pending',
	Completed = 'completed',
	Failed = 'failed',
}

export type Transaction = {
	$id: Transaction$Id
	fromChainId: number
	toChainId: number
	fromAmount: bigint
	toAmount: bigint
	destTxHash: string | null
	status: BridgeTransactionStatus
	updatedAt: number
}
