/**
 * Uniswap V4 pools collection. Keyed by chainId:id for cross-chain uniqueness.
 */

import type { FetchPoolsParams } from '$/api/uniswap.ts'
import { fetchPoolsFromSubgraph } from '$/api/uniswap-subgraph.ts'
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

const getKey = (pool: UniswapPoolRow) => `${pool.$id.chainId}:${pool.$id.id}`

export const uniswapPoolsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.UniswapPools,
		storageKey: CollectionId.UniswapPools,
		getKey,
		parser: { stringify, parse },
	}),
)

export const fetchUniswapPools = async (
	params: FetchPoolsParams,
	getPools: (p: FetchPoolsParams) => Promise<UniswapPool[]>,
): Promise<UniswapPool[]> => {
	const pools = await getPools(params)
	for (const pool of pools) {
		const pool: UniswapPoolRow = {
			...normalizeUniswapPool(pool),
			$source: DataSource.Uniswap,
		}
		const key = getKey(pool)
		const existing = uniswapPoolsCollection.state.get(key)
		if (existing) {
			uniswapPoolsCollection.update(key, (draft) => {
				Object.assign(draft, pool)
			})
		} else {
			uniswapPoolsCollection.insert(pool)
		}
	}
	return pools
}

export const fetchUniswapPoolsFromSubgraphAndUpsert = async (
	chainId: number,
	first?: number,
	skip?: number,
): Promise<UniswapPool[]> => {
	const pools = await fetchPoolsFromSubgraph({ chainId, first, skip })
	for (const pool of pools) {
		const pool: UniswapPoolRow = {
			...normalizeUniswapPool(pool),
			$source: DataSource.Uniswap,
		}
		const key = getKey(pool)
		const existing = uniswapPoolsCollection.state.get(key)
		if (existing) {
			uniswapPoolsCollection.update(key, (draft) => {
				Object.assign(draft, pool)
			})
		} else {
			uniswapPoolsCollection.insert(pool)
		}
	}
	return pools
}
