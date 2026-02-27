/**
 * State channel states: signed state updates (in-memory).
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId } from '$/constants/data-sources.ts'
import { Protocol } from '$/constants/protocol.ts'
import type { YellowChannelState } from '$/data/YellowChannelState.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type StateChannelStateRow = YellowChannelState & {
	$source: DataSourceId
	protocol: Protocol
}

export const stateChannelStatesCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.StateChannelStates,
		getKey: (row: StateChannelStateRow) => row.id,
	}),
)
