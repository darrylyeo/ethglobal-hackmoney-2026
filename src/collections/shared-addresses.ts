/**
 * Shared addresses collection: addresses shared in a room with verification status.
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import type { SharedAddress } from '$/data/SharedAddress'

export type SharedAddressRow = SharedAddress & { $source: DataSource }

export const sharedAddressesCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'shared-addresses',
		getKey: (row: SharedAddressRow) => row.id,
	}),
)

export { sharedAddressKey } from './shared-addresses-keys'
