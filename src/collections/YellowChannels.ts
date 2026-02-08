/**
 * Yellow channels: payment channels between actors (in-memory, synced from Clearnode).
 */

import { DataSource } from '$/constants/data-sources.ts'
import type { YellowChannel } from '$/data/YellowChannel.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type YellowChannelRow = YellowChannel & { $source: DataSource }

export const yellowChannelsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.YellowChannels,
		getKey: (row: YellowChannelRow) => row.id,
	}),
)
