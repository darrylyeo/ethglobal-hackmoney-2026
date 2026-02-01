/**
 * Yellow deposits: USDC balances in Custody Contract (in-memory, synced from API/Clearnode).
 */

import { createCollection, localOnlyCollectionOptions } from '@tanstack/svelte-db'

export type YellowDeposit = {
	id: string
	chainId: number
	address: `0x${string}`
	availableBalance: bigint
	lockedBalance: bigint
	lastUpdated: number
}

export const yellowDepositsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'yellow-deposits',
		getKey: (row: YellowDeposit) => row.id,
	}),
)
