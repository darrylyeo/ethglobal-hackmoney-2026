/**
 * State channel transfers: off-chain transfers within channels (in-memory).
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { Protocol } from '$/constants/protocol.ts'
import type { YellowTransfer } from '$/data/YellowTransfer.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type StateChannelTransferRow = YellowTransfer & {
	$source: DataSource
	protocol: Protocol
}

export const stateChannelTransfersCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.StateChannelTransfers,
		getKey: (row: StateChannelTransferRow) => row.id,
	}),
)
