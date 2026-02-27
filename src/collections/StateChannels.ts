/**
 * State channels (e.g. Protocol.Yellow / EIP-7824): payment channels between actors (in-memory, synced from Clearnode).
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId } from '$/constants/data-sources.ts'
import { Protocol } from '$/constants/protocol.ts'
import type { YellowChannel } from '$/data/YellowChannel.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type StateChannelRow = YellowChannel & {
	$source: DataSourceId
	protocol: Protocol
}

export const stateChannelsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.StateChannels,
		getKey: (row: StateChannelRow) => row.id,
	}),
)
