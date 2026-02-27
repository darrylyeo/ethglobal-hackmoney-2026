/**
 * Actor: A unique account address on any chain.
 * $id: { $network: Network$Id, address, interopAddress? }
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import { toInteropName } from '$/constants/interop.ts'
import type { Actor } from '$/data/Actor.ts'
import { queryClient } from '$/lib/db/queryClient.ts'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { createCollection } from '@tanstack/svelte-db'

export const actorKey = (chainId: number, address: `0x${string}`) =>
	`${chainId}-${address.toLowerCase()}`

export const actorsCollection = createCollection(
	queryCollectionOptions({
		id: CollectionId.Actors,
		queryKey: [CollectionId.Actors],
		queryFn: () => Promise.resolve<WithSource<Actor>[]>([]),
		queryClient,
		getKey: (row: WithSource<Actor>) => actorKey(row.$id.$network.chainId, row.$id.address),
	}),
)

export const insertActor = (actor: Actor) => {
	actorsCollection.utils.writeUpsert({ ...actor, $source: DataSourceId.Local })
}

export const insertActorsForAddress = (
	address: `0x${string}`,
	chainIds: number[],
) => {
	for (const chainId of chainIds) {
		actorsCollection.utils.writeUpsert({
			$id: {
				$network: { chainId },
				address,
				interopAddress: toInteropName(chainId, address),
			},
			$source: DataSourceId.Local,
		})
	}
}
