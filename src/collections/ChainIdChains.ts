/**
 * Chainlist (chainlist.org) chains in TanStack DB. Populated by our API client only.
 * For chainId lookup use networksByChainId from $/constants/networks.ts.
 */

import type { ChainListChain } from '$/api/chainlist.ts'
import { fetchChainlistChains } from '$/api/chainlist.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId } from '$/constants/data-sources.ts'
import { queryClient } from '$/lib/db/queryClient.ts'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { createCollection } from '@tanstack/svelte-db'

export type ChainIdChain$Id = { chainId: number }

export type ChainIdChainRow = ChainListChain & {
	$id: ChainIdChain$Id
	$source: DataSourceId
}

export const chainIdChainsCollection = createCollection(
	queryCollectionOptions({
		id: CollectionId.ChainIdChains,
		queryKey: [CollectionId.ChainIdChains],
		queryFn: async () => {
			const chains = await fetchChainlistChains()
			return chains.map(
				(c): ChainIdChainRow => ({
					...c,
					$id: { chainId: c.chainId },
					$source: DataSourceId.ChainList,
				}),
			)
		},
		queryClient,
		getKey: (row: ChainIdChainRow) => String(row.$id.chainId),
	}),
)
