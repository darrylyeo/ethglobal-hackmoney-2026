/**
 * Session simulations collection (1:many per session; each run has id, result, status).
 * Persists to localStorage across sessions.
 */

import { CollectionId } from '$/constants/collections.ts'
import type { TransactionSessionSimulation } from '$/data/TransactionSessionSimulation.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type TransactionSessionSimulationRow = TransactionSessionSimulation

export const sessionSimulationsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.SessionSimulations,
		storageKey: CollectionId.SessionSimulations,
		getKey: (row: TransactionSessionSimulationRow) => row.id,
		parser: { stringify, parse },
	}),
)
