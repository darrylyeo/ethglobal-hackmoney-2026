/**
 * Coins (ERC20 token list). Persisted to localStorage; hydrated from constants when empty.
 */

import { CollectionId } from '$/constants/collections.ts'
import type {
	Erc20Coin$Id,
	Erc20Token,
} from '$/constants/coin-instances.ts'
import { erc20Instances } from '$/constants/coin-instances.ts'
import { DataSource } from '$/constants/data-sources.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type CoinRow = Omit<Erc20Token, '$id'> & {
	$id: Erc20Coin$Id
	$source: DataSource
}

export const toCoinRow = (t: Erc20Token): CoinRow => ({
	...t,
	$id: t.$id,
	$source: DataSource.Local,
})

export const coinsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.Coins,
		storageKey: CollectionId.Coins,
		getKey: (row: CoinRow) =>
			`${row.$id.$network.chainId}-${row.$id.address.toLowerCase()}`,
		parser: { stringify, parse },
	}),
)

/** Seed collection from constants when empty. Call once in browser (e.g. layout). */
export function ensureCoinsHydrated(): void {
	for (const t of erc20Instances) {
		const row = toCoinRow(t)
		const key = `${row.$id.$network.chainId}-${row.$id.address.toLowerCase()}`
		if (!coinsCollection.state.get(key)) coinsCollection.insert(row)
	}
}
