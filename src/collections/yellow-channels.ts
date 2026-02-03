/**
 * Yellow channels: payment channels between actors (in-memory, synced from Clearnode).
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import type { YellowChannel } from '$/data/YellowChannel'

export type YellowChannelRow = YellowChannel & { $source: DataSource }

export const yellowChannelsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'yellow-channels',
		getKey: (row: YellowChannelRow) => row.id,
	}),
)
