import { createCollection } from '@tanstack/svelte-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { ercTokens } from '$/constants/coins'
import type { Erc20Token } from '$/constants/coins'
import { queryClient } from '$/lib/db/query-client'

export type Coin$id = { network: number; address: `0x${string}` }

export type CoinRow = Erc20Token & { $id: Coin$id }

export const normalizeCoin = (entry: Erc20Token): CoinRow => ({
	...entry,
	$id: { network: entry.chainId, address: entry.address },
})

export const coinsCollection = createCollection(
	queryCollectionOptions({
		id: 'coins',
		queryKey: ['coins'],
		queryFn: () => Promise.resolve(ercTokens.map(normalizeCoin)),
		queryClient,
		getKey: (row: CoinRow) => (
			`${row.$id.network}-${row.$id.address.toLowerCase()}`
		),
	}),
)
