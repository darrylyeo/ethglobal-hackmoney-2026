/**
 * Networks list. Persisted to localStorage; hydrated from constants when empty.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { Network } from '$/constants/networks.ts'
import { networks } from '$/constants/networks.ts'
import type { NetworkEntry } from '$/data/Network.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type NetworkRow = NetworkEntry & { $source: DataSource }

export const normalizeNetwork = (entry: Network): NetworkEntry => ({
	...entry,
	$id: { chainId: entry.chainId },
})

export const networksCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.Networks,
		storageKey: CollectionId.Networks,
		getKey: (row: NetworkRow) => String(row.$id.chainId),
		parser: { stringify, parse },
	}),
)

/** Seed collection from constants when empty. Call once in browser (e.g. layout). */
export function ensureNetworksHydrated(): void {
	for (const entry of networks) {
		const row: NetworkRow = {
			...normalizeNetwork(entry),
			$source: DataSource.Local,
		}
		const key = String(row.$id.chainId)
		if (!networksCollection.state.get(key)) networksCollection.insert(row)
	}
}
