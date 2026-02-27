/**
 * Uniswap V4 positions (NFTs) collection. Keyed by chainId:id for cross-chain uniqueness.
 */

import type { FetchPositionsParams } from '$/api/uniswap.ts'
import { fetchPositionsFromSubgraph } from '$/api/uniswap-subgraph.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import type { UniswapPosition } from '$/data/UniswapPosition.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { normalizeUniswapPosition } from './UniswapPositionsNormalize.ts'

const getKey = (position: WithSource<UniswapPosition>) => `${position.$id.chainId}:${position.$id.id}`

export const uniswapPositionsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.UniswapPositions,
		storageKey: CollectionId.UniswapPositions,
		getKey,
		parser: { stringify, parse },
	}),
)

export const fetchUniswapPositions = async (
	params: FetchPositionsParams,
	getPositions?: (
		p: FetchPositionsParams,
	) => Promise<UniswapPosition[]>,
): Promise<UniswapPosition[]> => {
	const fromSubgraph = await fetchPositionsFromSubgraph(params).catch(() => [])
	for (const pos of fromSubgraph) {
		const row: WithSource<UniswapPosition> = {
			...normalizeUniswapPosition(pos),
			$source: DataSourceId.Uniswap,
		}
		const key = getKey(row)
		const existing = uniswapPositionsCollection.state.get(key)
		if (existing) {
			uniswapPositionsCollection.update(key, (draft) => {
				Object.assign(draft, row)
			})
		} else {
			uniswapPositionsCollection.insert(row)
		}
	}
	const fromSdk = getPositions ? await getPositions(params).catch(() => []) : []
	for (const pos of fromSdk) {
		const row: WithSource<UniswapPosition> = {
			...normalizeUniswapPosition(pos),
			$source: DataSourceId.Uniswap,
		}
		const key = getKey(row)
		const existing = uniswapPositionsCollection.state.get(key)
		if (existing) {
			uniswapPositionsCollection.update(key, (draft) => {
				Object.assign(draft, row)
			})
		} else {
			uniswapPositionsCollection.insert(row)
		}
	}
	return fromSubgraph.length ? fromSubgraph : fromSdk
}
