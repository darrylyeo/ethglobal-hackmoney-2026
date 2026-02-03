export type YellowChannelAllocation = {
	destination: `0x${string}`
	token: `0x${string}`
	amount: bigint
}

export type YellowChannelState = {
	id: string
	channelId: `0x${string}`
	intent: number
	version: number
	stateData: `0x${string}`
	allocations: YellowChannelAllocation[]
	signatures: `0x${string}`[]
	isFinal: boolean
	timestamp: number
}
