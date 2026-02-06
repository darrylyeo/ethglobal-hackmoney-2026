/**
 * Uniswap V4 pools collection. In-memory cache keyed by pool id.
 */

import { DataSource } from '$/constants/data-sources'
import type { UniswapPool } from '$/data/UniswapPool'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { normalizeUniswapPool } from './uniswap-pools-normalize'

export type UniswapPoolRow = UniswapPool & { $source: DataSource }

export const uniswapPoolsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'uniswap-pools',
		getKey: (row: UniswapPoolRow) => row.id,
	}),
)
