export type SharedAddress = {
	id: string
	roomId: string
	peerId: string
	address: `0x${string}`
	targetPeerIds: string[] | null
	/** Unix time in milliseconds (normalized at ingest). */
	sharedAt: number,
}
