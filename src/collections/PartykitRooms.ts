/**
 * PartyKit rooms collection: room metadata (in-memory, synced from server).
 */

import { CollectionId } from '$/constants/collections.ts'
import { type WithSource } from '$/constants/data-sources.ts'
import type { Room } from '$/data/Room.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export const partykitRoomsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.PartykitRooms,
		getKey: (room: WithSource<Room>) => room.$id.id,
	}),
)
