/**
 * Actor: A unique account address on any chain.
 * $id: { network, address }
 */

import { createCollection } from '@tanstack/svelte-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { queryClient } from '$/lib/db/query-client'

export type Actor$id = { network: number; address: `0x${string}` }

export type Actor = {
	$id: Actor$id
	chainId: number
	address: `0x${string}`
}

export const actorKey = (chainId: number, address: `0x${string}`) =>
	`${chainId}-${address.toLowerCase()}`

export const actorsCollection = createCollection(
	queryCollectionOptions({
		id: 'actors',
		queryKey: ['actors'],
		queryFn: () => Promise.resolve<Actor[]>([]),
		queryClient,
		getKey: (row: Actor) => actorKey(row.$id.network, row.$id.address),
	}),
)

export const insertActor = (actor: Actor) => {
	actorsCollection.utils.writeUpsert(actor)
}

export const insertActorsForAddress = (
	address: `0x${string}`,
	chainIds: number[],
) => {
	for (const chainId of chainIds) {
		actorsCollection.utils.writeUpsert({
			$id: { network: chainId, address },
			chainId,
			address,
		})
	}
}
