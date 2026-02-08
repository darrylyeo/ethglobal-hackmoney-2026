/**
 * State channel deposits (e.g. Protocol.Yellow): USDC balances in Custody Contract (in-memory, synced from API/Clearnode).
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { Protocol } from '$/constants/protocol.ts'
import type { YellowDeposit } from '$/data/YellowDeposit.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type StateChannelDepositRow = YellowDeposit & {
	$source: DataSource
	protocol: Protocol
}

export const stateChannelDepositsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.StateChannelDeposits,
		getKey: (row: StateChannelDepositRow) => row.id,
	}),
)
