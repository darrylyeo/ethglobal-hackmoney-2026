import { createCollection } from '@tanstack/svelte-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { DataSource } from '$/constants/data-sources'
import { ercTokens } from '$/constants/coins'
import type { Erc20Token } from '$/constants/coins'
import { toInteropName } from '$/constants/interop'
import type { CoinEntry } from '$/data/Coin'
import { queryClient } from '$/lib/db/query-client'

export type CoinRow = CoinEntry & { $source: DataSource }

export const normalizeCoin = (entry: Erc20Token): CoinEntry => ({
	...entry,
	$id: {
		network: entry.chainId,
		address: entry.address,
		interopAddress: toInteropName(entry.chainId, entry.address),
	},
})

export const coinsCollection = createCollection(
	queryCollectionOptions({
		id: 'coins',
		queryKey: ['coins'],
		queryFn: () =>
			Promise.resolve(
				ercTokens
					.map(normalizeCoin)
					.map((row) => ({ ...row, $source: DataSource.Local })),
			),
		queryClient,
		getKey: (row: CoinRow) =>
			`${row.$id.network}-${row.$id.address.toLowerCase()}`,
	}),
)
