import { createCollection } from '@tanstack/svelte-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { ercTokens } from '$/constants/coins'
import type { Erc20Token } from '$/constants/coins'
import { queryClient } from '$/lib/db/query-client'
import { normalizeCoin } from './coins-normalize'

export { normalizeCoin } from './coins-normalize'

export const coinsCollection = createCollection(
	queryCollectionOptions({
		id: 'coins',
		queryKey: ['coins'],
		queryFn: () => Promise.resolve(ercTokens.map(normalizeCoin)),
		queryClient,
		getKey: (row: Erc20Token) => `${row.chainId}-${row.address}`,
	}),
)
