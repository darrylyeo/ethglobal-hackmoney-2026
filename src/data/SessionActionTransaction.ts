export type SessionActionTransaction = {
	id: string
	sessionId: string
	indexInSequence: number
	txHash: `0x${string}`
	chainId: number
	createdAt: number
}
