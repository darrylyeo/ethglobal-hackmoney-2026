/**
 * Transfer requests: room-scoped proposals to send off-chain transfers.
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type TransferRequestStatus =
	| 'pending'
	| 'accepted'
	| 'rejected'
	| 'expired'
	| 'sent'

export type TransferAllocation = {
	asset: string
	amount: string
}

export type TransferRequest = {
	id: string
	roomId: string
	from: `0x${string}`
	to: `0x${string}`
	allocations: TransferAllocation[]
	status: TransferRequestStatus
	createdAt: number
	expiresAt: number
}

export const transferRequestsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'transfer-requests',
		getKey: (row: TransferRequest) => row.id,
	}),
)
