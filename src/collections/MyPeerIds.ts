/**
 * My peer IDs: persisted peerId(s) for "me" per room (used to derive "verified by me").
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type MyPeerIdRow = {
	roomId: string
	peerId: string
	$source: DataSource
}

export const myPeerIdsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.MyPeerIds,
		getKey: (row: MyPeerIdRow) => row.roomId,
	}),
)
