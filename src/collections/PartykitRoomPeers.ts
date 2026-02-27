/**
 * PartyKit room peers collection: participants in a room (in-memory, synced from server).
 */

import { CollectionId } from '$/constants/collections.ts'
import { type WithSource } from '$/constants/data-sources.ts'
import type { RoomPeer } from '$/data/RoomPeer.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export const partykitRoomPeersCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.PartykitRoomPeers,
		getKey: (row: WithSource<RoomPeer>) => row.id,
	}),
)
