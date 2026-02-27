/**
 * Wallets collection: EIP-6963 discovered wallet providers.
 * In-memory only (providers are runtime objects, can't be serialized).
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import type { Wallet, Wallet$Id } from '$/data/Wallet.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify } from 'devalue'

export const walletsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.Wallets,
		getKey: (row: WithSource<Wallet>) => stringify(row.$id),
	}),
)

export const getWallet = ($id: Wallet$Id) =>
	walletsCollection.state.get(stringify($id))

export const upsertWallet = (row: Wallet) => {
	if (!row?.$id?.rdns) return
	const key = stringify(row.$id)
	const existing = walletsCollection.state.get(key)
	if (existing) {
		walletsCollection.update(key, (draft) => {
			draft.name = row.name
			draft.icon = row.icon
			draft.rdns = row.rdns
			draft.provider = row.provider
			draft.$source = DataSourceId.Local
		})
	} else {
		walletsCollection.insert({ ...row, $source: DataSourceId.Local })
	}
}
