/**
 * Uniswap V4 positions (NFTs) collection. In-memory cache keyed by position id.
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import { normalizeUniswapPosition } from './uniswap-positions-normalize'
import type { UniswapPosition } from '$/data/UniswapPosition'

export type UniswapPositionRow = UniswapPosition & { $source: DataSource }

export const uniswapPositionsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'uniswap-positions',
		getKey: (row: UniswapPositionRow) => row.id,
	}),
)
