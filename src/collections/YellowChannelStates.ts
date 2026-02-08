/**
 * Yellow channel states: signed state updates (in-memory).
 */

import { DataSource } from '$/constants/data-sources.ts'
import type { YellowChannelState } from '$/data/YellowChannelState.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type YellowChannelStateRow = YellowChannelState & { $source: DataSource }

export const yellowChannelStatesCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.YellowChannelStates,
		getKey: (row: YellowChannelStateRow) => row.id,
	}),
)
