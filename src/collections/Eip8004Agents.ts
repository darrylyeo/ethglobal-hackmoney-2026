import { CollectionId } from '$/constants/collections.ts'
import type { Eip8004Agent } from '$/data/Eip8004Agent.ts'
import { eip8004AgentIdToString } from '$/data/Eip8004Agent.ts'
import { fetchEip8004Agents } from '$/api/eip-8004.ts'
import { queryClient } from '$/lib/db/queryClient.ts'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { createCollection } from '@tanstack/svelte-db'

export const eip8004AgentsCollection = createCollection(
	queryCollectionOptions({
		id: CollectionId.Eip8004Agents,
		queryKey: [CollectionId.Eip8004Agents],
		queryFn: fetchEip8004Agents,
		queryClient,
		staleTime: 300_000,
		getKey: (row: Eip8004Agent) => eip8004AgentIdToString(row.$id),
	}),
)
