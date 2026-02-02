/**
 * Yellow channels: payment channels between actors (in-memory, synced from Clearnode).
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type ChannelStatus =
	| 'pending'
	| 'active'
	| 'closing'
	| 'closed'
	| 'disputed'

export type YellowChannel = {
	id: string
	chainId: number
	participant0: `0x${string}`
	participant1: `0x${string}`
	asset: `0x${string}`
	totalDeposited: bigint
	balance0: bigint
	balance1: bigint
	turnNum: number
	status: ChannelStatus
	roomId?: string
	createdAt: number
	updatedAt: number
}

export const yellowChannelsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'yellow-channels',
		getKey: (row: YellowChannel) => row.id,
	}),
)
