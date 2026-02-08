export type SessionActionTransaction = {
	id: string
	sessionId: string
	actionIndex: number
	txHash: `0x${string}`
	chainId: number
	createdAt: number
}
