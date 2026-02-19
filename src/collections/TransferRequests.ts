/**
 * Transfer requests: room-scoped proposals to send off-chain transfers.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { TransferRequest } from '$/data/TransferRequest.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type TransferRequestRow = TransferRequest & { $source: DataSource }

export const transferRequestsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.TransferRequests,
		storageKey: CollectionId.TransferRequests,
		getKey: (row: TransferRequestRow) => row.id,
		parser: { stringify, parse },
	}),
)
