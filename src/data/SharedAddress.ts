export type SharedAddress = {
	id: string
	roomId: string
	peerId: string
	address: `0x${string}`
	verifiedBy: string[]
	sharedAt: number
}
