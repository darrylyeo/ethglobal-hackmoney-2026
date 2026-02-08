/**
 * Transfer requests: room-scoped proposals to send off-chain transfers.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { TransferRequest } from '$/data/TransferRequest.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type TransferRequestRow = TransferRequest & { $source: DataSource }

export const transferRequestsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.TransferRequests,
		getKey: (row: TransferRequestRow) => row.id,
	}),
)
