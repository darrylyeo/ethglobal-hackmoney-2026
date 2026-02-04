/**
 * Transaction session simulations collection.
 * Persists to localStorage across sessions.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'
import { DataSource } from '$/constants/data-sources'
import type { TransactionSessionSimulation } from '$/data/TransactionSessionSimulation'

export type TransactionSessionSimulationRow = TransactionSessionSimulation & {
	$source: DataSource
}

export const transactionSessionSimulationsCollection = createCollection(
	localStorageCollectionOptions({
		id: 'transaction-session-simulations',
		storageKey: 'transaction-session-simulations',
		getKey: (row: TransactionSessionSimulationRow) => row.id,
		parser: { stringify, parse },
	}),
)
