/**
 * Sessions collection (transaction/session flow state).
 * Persists to localStorage across sessions.
 */

import { CollectionId } from '$/constants/collections.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'
import type { TransactionSession } from '$/data/TransactionSession.ts'

export type TransactionSessionRow = TransactionSession

export const sessionsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.Sessions,
		storageKey: CollectionId.Sessions,
		getKey: (row: TransactionSessionRow) => row.id,
		parser: { stringify, parse },
	}),
)
