/**
 * Uniswap V4 positions (NFTs) collection. In-memory cache keyed by position id.
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import {
	normalizeUniswapPosition,
	type UniswapPosition,
} from './uniswap-positions-normalize'

export type { UniswapPosition } from './uniswap-positions-normalize'
export { normalizeUniswapPosition }

export const uniswapPositionsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'uniswap-positions',
		getKey: (row: UniswapPosition) => row.id,
	}),
)
