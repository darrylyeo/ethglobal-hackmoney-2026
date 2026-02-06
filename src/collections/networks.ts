import { DataSource } from '$/constants/data-sources'
import type { Network } from '$/constants/networks'
import { networks } from '$/constants/networks'
import type { NetworkEntry } from '$/data/Network'
import { queryClient } from '$/lib/db/query-client'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { createCollection } from '@tanstack/svelte-db'

export type NetworkRow = NetworkEntry & { $source: DataSource }

export const normalizeNetwork = (entry: Network): NetworkEntry => ({
	...entry,
	$id: entry.id,
})

export const networksCollection = createCollection(
	queryCollectionOptions({
		id: 'networks',
		queryKey: ['networks'],
		queryFn: () =>
			Promise.resolve(
				networks
					.map(normalizeNetwork)
					.map((row) => ({ ...row, $source: DataSource.Local })),
			),
		queryClient,
		getKey: (row: NetworkRow) => String(row.$id),
	}),
)
