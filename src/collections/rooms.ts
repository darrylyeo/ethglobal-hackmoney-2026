/**
 * Rooms collection: PartyKit room metadata (in-memory, synced from server).
 */

import { DataSource } from '$/constants/data-sources.ts'
import type { Room } from '$/data/Room.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type RoomRow = Room & { $source: DataSource }

export const roomsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.Rooms,
		getKey: (row: RoomRow) => row.id,
	}),
)
