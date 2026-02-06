/**
 * Uniswap V4 positions (NFTs) collection. In-memory cache keyed by position id.
 */

import { DataSource } from '$/constants/data-sources'
import type { UniswapPosition } from '$/data/UniswapPosition'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type UniswapPositionRow = UniswapPosition & { $source: DataSource }

export const uniswapPositionsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'uniswap-positions',
		getKey: (row: UniswapPositionRow) => row.id,
	}),
)
