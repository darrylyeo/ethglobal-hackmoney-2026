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
