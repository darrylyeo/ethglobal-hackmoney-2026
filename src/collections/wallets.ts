/**
 * Wallets collection: EIP-6963 discovered wallet providers.
 * In-memory only (providers are runtime objects, can't be serialized).
 */

import { createCollection, localOnlyCollectionOptions } from '@tanstack/svelte-db'
import { stringify } from 'devalue'
import type { EIP1193Provider } from '$/lib/wallet'

export type Wallet$id = {
	rdns: string
}

export type WalletRow = {
	$id: Wallet$id
	name: string
	icon: string
	rdns: string
	provider: EIP1193Provider
}

export const walletsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'wallets',
		getKey: (row: WalletRow) => stringify(row.$id),
	}),
)

export const getWallet = ($id: Wallet$id) => (
	walletsCollection.state.get(stringify($id))
)

export const upsertWallet = (row: WalletRow) => {
	if (!row?.$id?.rdns) return
	const key = stringify(row.$id)
	const existing = walletsCollection.state.get(key)
	if (existing) {
		walletsCollection.update(key, (draft) => {
			draft.name = row.name
			draft.icon = row.icon
			draft.rdns = row.rdns
			draft.provider = row.provider
		})
	} else {
		walletsCollection.insert(row)
	}
}
