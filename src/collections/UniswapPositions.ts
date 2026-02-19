/**
 * Uniswap V4 positions (NFTs) collection. In-memory cache keyed by position id.
 */

import type { FetchPositionsParams } from '$/api/uniswap.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { UniswapPosition } from '$/data/UniswapPosition.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { normalizeUniswapPosition } from './UniswapPositionsNormalize.ts'

export type UniswapPositionRow = UniswapPosition & { $source: DataSource }

export const uniswapPositionsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.UniswapPositions,
		storageKey: CollectionId.UniswapPositions,
		getKey: (row: UniswapPositionRow) => row.id,
		parser: { stringify, parse },
	}),
)

export const fetchUniswapPositions = async (
	params: FetchPositionsParams,
	getPositions: (
		p: FetchPositionsParams,
	) => Promise<UniswapPosition[]>,
): Promise<UniswapPosition[]> => {
	const positions = await getPositions(params)
	for (const pos of positions) {
		const row: UniswapPositionRow = {
			...normalizeUniswapPosition(pos),
			$source: DataSource.Uniswap,
		}
		const key = row.id
		const existing = uniswapPositionsCollection.state.get(key)
		if (existing) {
			uniswapPositionsCollection.update(key, (draft) => {
				Object.assign(draft, row)
			})
		} else {
			uniswapPositionsCollection.insert(row)
		}
	}
	return positions
}
