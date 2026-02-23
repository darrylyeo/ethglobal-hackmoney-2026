export type YellowTransfer = {
	id: string
	channelId: string
	from: `0x${string}`
	to: `0x${string}`
	amount: bigint
	turnNum: number
	/** Unix time in milliseconds (normalized at ingest). */
	timestamp: number
	status: 'pending' | 'confirmed' | 'failed',
}

