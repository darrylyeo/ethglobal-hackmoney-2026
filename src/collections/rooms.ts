/**
 * Rooms collection: PartyKit room metadata (in-memory, synced from server).
 */

import { createCollection, localOnlyCollectionOptions } from '@tanstack/svelte-db'

export type Room = {
	id: string
	createdAt: number
	createdBy: string
	name?: string
}

export const roomsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'rooms',
		getKey: (row: Room) => row.id,
	}),
)
