/**
 * Uniswap V4 pools collection. In-memory cache keyed by pool id.
 */

import { createCollection, localOnlyCollectionOptions } from '@tanstack/svelte-db'
import { normalizeUniswapPool, type UniswapPool } from './uniswap-pools-normalize'

export type { UniswapPool } from './uniswap-pools-normalize'
export { normalizeUniswapPool }

export const uniswapPoolsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'uniswap-pools',
		getKey: (row: UniswapPool) => row.id,
	}),
)
