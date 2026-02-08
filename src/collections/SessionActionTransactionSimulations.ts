import { CollectionId } from '$/constants/collections.ts'
import type { SessionActionTransactionSimulation } from '$/data/SessionActionTransactionSimulation.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type SessionActionTransactionSimulationRow = SessionActionTransactionSimulation

export const sessionActionTransactionSimulationsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.SessionActionTransactionSimulations,
		storageKey: CollectionId.SessionActionTransactionSimulations,
		getKey: (row: SessionActionTransactionSimulationRow) => row.id,
		parser: { stringify, parse },
	}),
)
