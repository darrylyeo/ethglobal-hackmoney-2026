/**
 * Shared addresses collection: addresses shared in a room with verification status.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import type { SharedAddress } from '$/data/SharedAddress.ts'

export type SharedAddressRow = SharedAddress & { $source: DataSource }

export const sharedAddressesCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.SharedAddresses,
		getKey: (row: SharedAddressRow) => row.id,
	}),
)

export { sharedAddressKey } from './SharedAddressesKeys.ts'
