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
const getKey = (item: EnsAvatarRow | { chainId: number; address: string }) =>
	'$id' in item && item.$id
		? getKeyFromId(item.$id)
		: `${(item as { chainId: number }).chainId}:${(item as { address: string }).address.toLowerCase()}`

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

export const setCachedEnsAvatar = (avatar: EnsAvatarRow) => {
	const key = getKey(avatar)
	const existing = ensAvatarsCollection.state.get(key)
	if (existing) {
		ensAvatarsCollection.update(key, (draft) => {
			;(draft as EnsAvatarRow).$id = avatar.$id
			;(draft as EnsAvatarRow).avatarUrl = avatar.avatarUrl
			;(draft as EnsAvatarRow).primaryName = avatar.primaryName
		})
	} else {
		ensAvatarsCollection.insert(avatar)
	}
}
