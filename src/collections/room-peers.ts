/**
 * Room peers collection: participants in a PartyKit room (in-memory, synced from server).
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import type { RoomPeer } from '$/data/RoomPeer'

export type RoomPeerRow = RoomPeer & { $source: DataSource }

export const roomPeersCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'room-peers',
		getKey: (row: RoomPeerRow) => row.id,
	}),
)

export { roomPeerKey } from './room-peers-keys'
