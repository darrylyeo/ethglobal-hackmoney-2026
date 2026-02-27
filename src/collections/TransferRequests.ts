/**
 * Transfer requests: room-scoped proposals to send off-chain transfers.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import type { TransferRequest } from '$/data/TransferRequest.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export const transferRequestsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.TransferRequests,
		storageKey: CollectionId.TransferRequests,
		getKey: (row: WithSource<TransferRequest>) => row.id,
		parser: { stringify, parse },
	}),
)
