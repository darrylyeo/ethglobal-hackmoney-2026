/**
 * Yellow transfers: off-chain transfers within channels (in-memory).
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type YellowTransfer = {
	id: string
	channelId: string
	from: `0x${string}`
	to: `0x${string}`
	amount: bigint
	turnNum: number
	timestamp: number
	status: 'pending' | 'confirmed' | 'failed'
}

export const yellowTransfersCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'yellow-transfers',
		getKey: (row: YellowTransfer) => row.id,
	}),
)
