import { CollectionId } from '$/constants/collections.ts'
import type { CaipEntry } from '$/data/CaipEntry.ts'
import { fetchCaipEntries } from '$/api/caips.ts'
import { queryClient } from '$/lib/db/queryClient.ts'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { createCollection } from '@tanstack/svelte-db'

export const caipsCollection = createCollection(
	queryCollectionOptions({
		id: CollectionId.Caips,
		queryKey: [CollectionId.Caips],
		queryFn: fetchCaipEntries,
		queryClient,
		staleTime: 3600_000,
		getKey: (row: CaipEntry) => String(row.number),
	}),
)
