/**
 * Shared addresses collection: addresses shared in a room with verification status.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import type { SharedAddress } from '$/data/SharedAddress.ts'

export const sharedAddressesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.SharedAddresses,
		storageKey: CollectionId.SharedAddresses,
		getKey: (row: WithSource<SharedAddress>) => row.id,
		parser: { stringify, parse },
	}),
)
