import { CollectionId } from '$/constants/collections.ts'
import type { Eip8004Service } from '$/data/Eip8004Service.ts'
import { eip8004ServiceIdToString } from '$/data/Eip8004Service.ts'
import { fetchEip8004Services } from '$/api/eip-8004.ts'
import { queryClient } from '$/lib/db/queryClient.ts'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { createCollection } from '@tanstack/svelte-db'

export const eip8004ServicesCollection = createCollection(
	queryCollectionOptions({
		id: CollectionId.Eip8004Services,
		queryKey: [CollectionId.Eip8004Services],
		queryFn: fetchEip8004Services,
		queryClient,
		staleTime: 300_000,
		getKey: (row: Eip8004Service) => eip8004ServiceIdToString(row.$id),
	}),
)
