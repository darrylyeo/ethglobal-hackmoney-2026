/**
 * Yellow channel states: signed state updates (in-memory).
 */

import { createCollection, localOnlyCollectionOptions } from '@tanstack/svelte-db'

export type YellowChannelAllocation = {
	destination: `0x${string}`
	token: `0x${string}`
	amount: bigint
}

export type YellowChannelState = {
	id: string
	channelId: `0x${string}`
	intent: number
	version: number
	stateData: `0x${string}`
	allocations: YellowChannelAllocation[]
	signatures: `0x${string}`[]
	isFinal: boolean
	timestamp: number
}

export const yellowChannelStatesCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'yellow-channel-states',
		getKey: (row: YellowChannelState) => row.id,
	}),
)
