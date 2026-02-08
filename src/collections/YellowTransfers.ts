/**
 * Yellow transfers: off-chain transfers within channels (in-memory).
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { YellowTransfer } from '$/data/YellowTransfer.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type YellowTransferRow = YellowTransfer & { $source: DataSource }

export const yellowTransfersCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.YellowTransfers,
		getKey: (row: YellowTransferRow) => row.id,
	}),
)
