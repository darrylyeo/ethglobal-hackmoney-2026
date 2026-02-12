/**
 * Persisted cache of ENS avatar (and primary name) per (chainId, address).
 * Read by EvmActorProfiles to show avatars without refetch on reload.
 */

import { CollectionId } from '$/constants/collections.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import type { Network$Id } from '$/data/Network.ts'

export type EnsAvatar$Id = {
	$network: Network$Id
	address: `0x${string}`
}

export type EnsAvatarRow = {
	$id: EnsAvatar$Id
	avatarUrl?: string
	primaryName?: string
}

const getKeyFromId = (id: EnsAvatar$Id) =>
	`${id.$network.chainId}:${id.address.toLowerCase()}`
const getKey = (row: EnsAvatarRow | { chainId: number; address: string }) =>
	'$id' in row && row.$id
		? getKeyFromId(row.$id)
		: `${(row as { chainId: number }).chainId}:${(row as { address: string }).address.toLowerCase()}`

export const ensAvatarsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.EnsAvatars,
		storageKey: CollectionId.EnsAvatars,
		getKey,
		parser: { stringify, parse },
	}),
)

export const getCachedEnsAvatar = (
	chainId: number,
	address: `0x${string}`,
): EnsAvatarRow | undefined =>
	ensAvatarsCollection.state.get(
		getKeyFromId({ $network: { chainId }, address }),
	) as EnsAvatarRow | undefined

export const setCachedEnsAvatar = (row: EnsAvatarRow) => {
	const key = getKey(row)
	const existing = ensAvatarsCollection.state.get(key)
	if (existing) {
		ensAvatarsCollection.update(key, (draft) => {
			;(draft as EnsAvatarRow).$id = row.$id
			;(draft as EnsAvatarRow).avatarUrl = row.avatarUrl
			;(draft as EnsAvatarRow).primaryName = row.primaryName
		})
	} else {
		ensAvatarsCollection.insert(row)
	}
}
