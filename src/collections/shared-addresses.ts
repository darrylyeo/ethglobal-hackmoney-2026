/**
 * Shared addresses collection: addresses shared in a room with verification status.
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type SharedAddress = {
	id: string
	roomId: string
	peerId: string
	address: `0x${string}`
	verifiedBy: string[]
	sharedAt: number
}

export const sharedAddressesCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'shared-addresses',
		getKey: (row: SharedAddress) => row.id,
	}),
)

export { sharedAddressKey } from './shared-addresses-keys'
