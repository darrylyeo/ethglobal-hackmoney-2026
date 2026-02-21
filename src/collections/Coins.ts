import { CollectionId } from '$/constants/collections.ts'
import type {
	Erc20Coin$Id,
	Erc20Token,
} from '$/constants/coin-instances.ts'
import { erc20Instances } from '$/constants/coin-instances.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { queryClient } from '$/lib/db/queryClient.ts'
import { createCollection } from '@tanstack/svelte-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

export type CoinRow = Omit<Erc20Token, '$id'> & {
	$id: Erc20Coin$Id
	$source: DataSource
}

export const toCoinRow = (t: Erc20Token): CoinRow => ({
	...t,
	$id: t.$id,
	$source: DataSource.Local,
})

export const coinsCollection = createCollection(
	queryCollectionOptions({
		id: CollectionId.Coins,
		queryKey: [CollectionId.Coins],
		queryFn: () => Promise.resolve(erc20Instances.map(toCoinRow)),
		queryClient,
		getKey: (row: CoinRow) =>
			`${row.$id.$network.chainId}-${row.$id.address.toLowerCase()}`,
	}),
)
