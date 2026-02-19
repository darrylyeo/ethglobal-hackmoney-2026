/**
 * Shared addresses collection: addresses shared in a room with verification status.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import type { SharedAddress } from '$/data/SharedAddress.ts'

export type SharedAddressRow = SharedAddress & { $source: DataSource }

export const sharedAddressesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.SharedAddresses,
		storageKey: CollectionId.SharedAddresses,
		getKey: (row: SharedAddressRow) => row.id,
		parser: { stringify, parse },
	}),
)

export { sharedAddressKey } from './SharedAddressesKeys.ts'
