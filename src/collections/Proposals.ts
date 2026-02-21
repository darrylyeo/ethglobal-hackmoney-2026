import { CollectionId } from '$/constants/collections.ts'
import type { ProposalEntry } from '$/data/ProposalEntry.ts'
import { fetchProposalEntries } from '$/api/eips.ts'
import { queryClient } from '$/lib/db/queryClient.ts'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { createCollection } from '@tanstack/svelte-db'

export const proposalsCollection = createCollection(
	queryCollectionOptions({
		id: CollectionId.Proposals,
		queryKey: [CollectionId.Proposals],
		queryFn: fetchProposalEntries,
		queryClient,
		staleTime: 3600_000,
		getKey: (row: ProposalEntry) => String(row.number),
	}),
)
