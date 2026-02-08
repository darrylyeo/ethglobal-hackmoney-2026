/**
 * Room peers collection: participants in a PartyKit room (in-memory, synced from server).
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { RoomPeer } from '$/data/RoomPeer.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type RoomPeerRow = RoomPeer & { $source: DataSource }

export const roomPeersCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.RoomPeers,
		getKey: (row: RoomPeerRow) => row.id,
	}),
)

export { roomPeerKey } from './RoomPeersKeys.ts'
