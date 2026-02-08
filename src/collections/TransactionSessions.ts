/**
 * Transaction sessions collection.
 * Persists to localStorage across sessions.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'
import type { TransactionSession } from '$/data/TransactionSession.ts'

export type TransactionSessionRow = TransactionSession & { $source: DataSource }

export const transactionSessionsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.TransactionSessions,
		storageKey: CollectionId.TransactionSessions,
		getKey: (row: TransactionSessionRow) => row.id,
		parser: { stringify, parse },
	}),
)
