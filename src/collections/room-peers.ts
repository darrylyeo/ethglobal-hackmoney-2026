/**
 * Room peers collection: participants in a PartyKit room (in-memory, synced from server).
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

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

export const roomPeersCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'room-peers',
		getKey: (row: RoomPeer) => row.id,
	}),
)

export { roomPeerKey } from './room-peers-keys'
