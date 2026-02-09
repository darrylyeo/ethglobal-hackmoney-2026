/**
 * Persisted cache of ENS avatar (and primary name) per (chainId, address).
 * Read by EvmActorProfiles to show avatars without refetch on reload.
 */

import { CollectionId } from '$/constants/collections.ts'
import type { ChainId } from '$/constants/networks.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type EnsAvatar$Id = {
	chainId: ChainId
	address: `0x${string}`
}

export type EnsAvatarRow = EnsAvatar$Id & {
	avatarUrl?: string
	primaryName?: string
}

const getKey = (row: EnsAvatarRow) =>
	`${row.chainId}:${row.address.toLowerCase()}`

export const ensAvatarsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.EnsAvatars,
		storageKey: CollectionId.EnsAvatars,
		getKey,
		parser: { stringify, parse },
	}),
)

export const getCachedEnsAvatar = (
	chainId: ChainId,
	address: `0x${string}`,
): EnsAvatarRow | undefined =>
	ensAvatarsCollection.state.get(getKey({ chainId, address })) as
		| EnsAvatarRow
		| undefined

export const setCachedEnsAvatar = (row: EnsAvatarRow) => {
	const key = getKey(row)
	const existing = ensAvatarsCollection.state.get(key)
	if (existing) {
		ensAvatarsCollection.update(key, (draft) => {
			draft.avatarUrl = row.avatarUrl
			draft.primaryName = row.primaryName
		})
	} else {
		ensAvatarsCollection.insert(row)
	}
}
