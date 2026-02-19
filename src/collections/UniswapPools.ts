/**
 * Uniswap V4 pools collection. In-memory cache keyed by pool id.
 */

import type { FetchPoolsParams } from '$/api/uniswap.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { UniswapPool } from '$/data/UniswapPool.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { normalizeUniswapPool } from './UniswapPoolsNormalize.ts'

export type UniswapPoolRow = UniswapPool & { $source: DataSource }

export const uniswapPoolsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.UniswapPools,
		storageKey: CollectionId.UniswapPools,
		getKey: (row: UniswapPoolRow) => row.id,
		parser: { stringify, parse },
	}),
)

export const fetchUniswapPools = async (
	params: FetchPoolsParams,
	getPools: (p: FetchPoolsParams) => Promise<UniswapPool[]>,
): Promise<UniswapPool[]> => {
	const pools = await getPools(params)
	for (const pool of pools) {
		const row: UniswapPoolRow = {
			...normalizeUniswapPool(pool),
			$source: DataSource.Uniswap,
		}
		const key = row.id
		const existing = uniswapPoolsCollection.state.get(key)
		if (existing) {
			uniswapPoolsCollection.update(key, (draft) => {
				Object.assign(draft, row)
			})
		} else {
			uniswapPoolsCollection.insert(row)
		}
	}
	return pools
}
