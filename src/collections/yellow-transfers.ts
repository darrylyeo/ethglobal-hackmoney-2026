/**
 * Yellow transfers: off-chain transfers within channels (in-memory).
 */

import { DataSource } from '$/constants/data-sources'
import type { YellowTransfer } from '$/data/YellowTransfer'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type YellowTransferRow = YellowTransfer & { $source: DataSource }

export const yellowTransfersCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'yellow-transfers',
		getKey: (row: YellowTransferRow) => row.id,
	}),
)
