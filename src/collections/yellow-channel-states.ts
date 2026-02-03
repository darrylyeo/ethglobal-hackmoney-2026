/**
 * Yellow channel states: signed state updates (in-memory).
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import type { YellowChannelState } from '$/data/YellowChannelState'

export type YellowChannelStateRow = YellowChannelState & { $source: DataSource }

export const yellowChannelStatesCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'yellow-channel-states',
		getKey: (row: YellowChannelStateRow) => row.id,
	}),
)
