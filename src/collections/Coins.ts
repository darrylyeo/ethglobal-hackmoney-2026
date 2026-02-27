/**
 * Coins (ERC20 token list). Persisted to localStorage; hydrated from constants when empty.
 */

import { CollectionId } from '$/constants/collections.ts'
import type {
	Erc20Coin$Id,
	Erc20Token,
} from '$/constants/coin-instances.ts'
import { erc20Instances } from '$/constants/coin-instances.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

type Coin = Omit<Erc20Token, '$id'> & { $id: Erc20Coin$Id }

export const toCoinRow = (t: Erc20Token): WithSource<Coin> => ({
	...t,
	$id: t.$id,
	$source: DataSourceId.Local,
})

export const coinsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.Coins,
		storageKey: CollectionId.Coins,
		getKey: (row: WithSource<Coin>) =>
			`${row.$id.$network.chainId}-${row.$id.address.toLowerCase()}`,
		parser: { stringify, parse },
	}),
)

/** Seed collection from constants when empty. Call once in browser (e.g. layout). */
export function ensureCoinsHydrated(): void {
	for (const t of erc20Instances) {
		const coin = toCoinRow(t)
		const key = `${coin.$id.$network.chainId}-${coin.$id.address.toLowerCase()}`
		if (!coinsCollection.state.get(key)) coinsCollection.insert(coin)
	}
}
