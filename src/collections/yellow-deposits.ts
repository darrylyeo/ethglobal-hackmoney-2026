/**
 * Yellow deposits: USDC balances in Custody Contract (in-memory, synced from API/Clearnode).
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import type { YellowDeposit } from '$/data/YellowDeposit'

export type YellowDepositRow = YellowDeposit & { $source: DataSource }

export const yellowDepositsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'yellow-deposits',
		getKey: (row: YellowDepositRow) => row.id,
	}),
)
