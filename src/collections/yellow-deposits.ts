/**
 * Yellow deposits: USDC balances in Custody Contract (in-memory, synced from API/Clearnode).
 */

import { DataSource } from '$/constants/data-sources.ts'
import type { YellowDeposit } from '$/data/YellowDeposit.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type YellowDepositRow = YellowDeposit & { $source: DataSource }

export const yellowDepositsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'yellow-deposits',
		getKey: (row: YellowDepositRow) => row.id,
	}),
)
