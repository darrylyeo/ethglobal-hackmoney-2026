/**
 * Uniswap V4 pools collection. In-memory cache keyed by pool id.
 */

import { DataSource } from '$/constants/data-sources.ts'
import type { UniswapPool } from '$/data/UniswapPool.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { normalizeUniswapPool } from './uniswap-pools-normalize.ts'

export type UniswapPoolRow = UniswapPool & { $source: DataSource }

export const uniswapPoolsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'uniswap-pools',
		getKey: (row: UniswapPoolRow) => row.id,
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
