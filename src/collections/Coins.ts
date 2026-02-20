import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { Erc20Token } from '$/constants/coins.ts'
import { ercTokens } from '$/constants/coins.ts'
import { toInteropName } from '$/constants/interop.ts'
import type { CoinEntry } from '$/data/Coin.ts'
import { queryClient } from '$/lib/db/queryClient.ts'
import { createCollection } from '@tanstack/svelte-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

export type CoinRow = CoinEntry & { $source: DataSource }

export const normalizeCoin = (entry: Erc20Token): CoinEntry => ({
	...entry,
	$id: {
		$network: { chainId: entry.chainId },
		address: entry.address,
		interopAddress: toInteropName(entry.chainId, entry.address),
	},
})

export const coinsCollection = createCollection(
	queryCollectionOptions({
		id: CollectionId.Coins,
		queryKey: [CollectionId.Coins],
		queryFn: () =>
			Promise.resolve(
				ercTokens
					.map(normalizeCoin)
					.map((row) => ({ ...row, $source: DataSource.Local })),
			),
		queryClient,
		getKey: (row: CoinRow) =>
			`${row.$id.$network.chainId}-${row.$id.address.toLowerCase()}`,
	}),
)
