export type ChannelStatus =
	| 'pending'
	| 'active'
	| 'closing'
	| 'closed'
	| 'disputed'

export type YellowChannel = {
	id: string,
	chainId: number,
	participant0: `0x${string}`,
	participant1: `0x${string}`,
	asset: `0x${string}`,
	totalDeposited: bigint,
	balance0: bigint,
	balance1: bigint,
	turnNum: number,
	status: ChannelStatus,
	roomId?: string,
	/** Unix time in milliseconds (normalized at ingest). */
	createdAt: number,
	/** Unix time in milliseconds (normalized at ingest). */
	updatedAt: number,
}

