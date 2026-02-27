/**
 * Uniswap V4 pools collection. Keyed by chainId:id for cross-chain uniqueness.
 */

import type { FetchPoolsParams } from '$/api/uniswap.ts'
import { fetchPoolsFromSubgraph } from '$/api/uniswap-subgraph.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import type { UniswapPool } from '$/data/UniswapPool.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { normalizeUniswapPool } from './UniswapPoolsNormalize.ts'

const getKey = (pool: WithSource<UniswapPool>) => `${pool.$id.chainId}:${pool.$id.id}`

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
		const row: WithSource<UniswapPool> = {
			...normalizeUniswapPool(pool),
			$source: DataSourceId.Uniswap,
		}
		const key = getKey(row)
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

export const fetchUniswapPoolsFromSubgraphAndUpsert = async (
	chainId: number,
	first?: number,
	skip?: number,
): Promise<UniswapPool[]> => {
	const pools = await fetchPoolsFromSubgraph({ chainId, first, skip })
	for (const pool of pools) {
		const row: WithSource<UniswapPool> = {
			...normalizeUniswapPool(pool),
			$source: DataSourceId.Uniswap,
		}
		const key = getKey(row)
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
