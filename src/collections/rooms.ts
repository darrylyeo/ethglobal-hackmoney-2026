/**
 * Rooms collection: PartyKit room metadata (in-memory, synced from server).
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import type { Room } from '$/data/Room'

export type RoomRow = Room & { $source: DataSource }

export const roomsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'rooms',
		getKey: (row: RoomRow) => row.id,
	}),
)
