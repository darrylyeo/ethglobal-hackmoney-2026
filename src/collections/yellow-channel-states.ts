/**
 * Yellow channel states: signed state updates (in-memory).
 */

import { createCollection, localOnlyCollectionOptions } from '@tanstack/svelte-db'

export type YellowChannelState = {
	id: string
	channelId: string
	turnNum: number
	balance0: bigint
	balance1: bigint
	appData: string
	signature0?: `0x${string}`
	signature1?: `0x${string}`
	isFinal: boolean
	timestamp: number
}

export const yellowChannelStatesCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'yellow-channel-states',
		getKey: (row: YellowChannelState) => row.id,
	}),
)
