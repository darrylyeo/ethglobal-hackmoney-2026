/**
 * Room peers collection: participants in a PartyKit room (in-memory, synced from server).
 */

import { DataSource } from '$/constants/data-sources.ts'
import type { RoomPeer } from '$/data/RoomPeer.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type RoomPeerRow = RoomPeer & { $source: DataSource }

export const roomPeersCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'room-peers',
		getKey: (row: RoomPeerRow) => row.id,
	}),
)

export { roomPeerKey } from './room-peers-keys.ts'
