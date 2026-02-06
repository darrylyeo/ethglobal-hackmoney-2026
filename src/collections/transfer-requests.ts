/**
 * Transfer requests: room-scoped proposals to send off-chain transfers.
 */

import { DataSource } from '$/constants/data-sources'
import type { TransferRequest } from '$/data/TransferRequest'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type TransferRequestRow = TransferRequest & { $source: DataSource }

export const transferRequestsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'transfer-requests',
		getKey: (row: TransferRequestRow) => row.id,
	}),
)
