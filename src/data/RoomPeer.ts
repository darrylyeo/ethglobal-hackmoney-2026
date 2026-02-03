export type RoomPeer = {
	id: string
	roomId: string
	peerId: string
	displayName?: string
	joinedAt: number
	lastSeenAt: number
	connectedAt?: number
	disconnectedAt?: number
	isConnected: boolean
}
