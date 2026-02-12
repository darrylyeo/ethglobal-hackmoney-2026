import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { Network } from '$/constants/networks.ts'
import { networks } from '$/constants/networks.ts'
import type { NetworkEntry } from '$/data/Network.ts'
import { queryClient } from '$/lib/db/query-client.ts'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { createCollection } from '@tanstack/svelte-db'

export type NetworkRow = NetworkEntry & { $source: DataSource }

export const normalizeNetwork = (entry: Network): NetworkEntry => ({
	...entry,
	$id: { chainId: entry.id },
})

export const networksCollection = createCollection(
	queryCollectionOptions({
		id: CollectionId.Networks,
		queryKey: ['networks'],
		queryFn: () =>
			Promise.resolve(
				networks
					.map(normalizeNetwork)
					.map((row) => ({ ...row, $source: DataSource.Local })),
			),
		queryClient,
		getKey: (row: NetworkRow) => String(row.$id.chainId),
	}),
)
