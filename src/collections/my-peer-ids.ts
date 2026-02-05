/**
 * My peer IDs: persisted peerId(s) for "me" per room (used to derive "verified by me").
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'

export type MyPeerIdRow = {
	roomId: string
	peerId: string
	$source: DataSource
}

export const myPeerIdsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'my-peer-ids',
		getKey: (row: MyPeerIdRow) => row.roomId,
	}),
)
