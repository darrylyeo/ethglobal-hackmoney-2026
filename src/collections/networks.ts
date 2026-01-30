import { createCollection } from '@tanstack/svelte-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { networks } from '$/constants/networks'
import { queryClient } from '$/lib/db/query-client'
import { normalizeNetwork } from './networks-normalize'

export { normalizeNetwork } from './networks-normalize'

export const networksCollection = createCollection(
	queryCollectionOptions({
		id: 'networks',
		queryKey: ['networks'],
		queryFn: () => Promise.resolve(networks.map(normalizeNetwork)),
		queryClient,
		getKey: (row) => row.id,
	}),
)
