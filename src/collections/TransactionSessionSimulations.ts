/**
 * Transaction session simulations collection.
 * Persists to localStorage across sessions.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { TransactionSessionSimulation } from '$/data/TransactionSessionSimulation.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type TransactionSessionSimulationRow = TransactionSessionSimulation & {
	$source: DataSource
}

export const transactionSessionSimulationsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.TransactionSessionSimulations,
		storageKey: CollectionId.TransactionSessionSimulations,
		getKey: (row: TransactionSessionSimulationRow) => row.id,
		parser: { stringify, parse },
	}),
)
