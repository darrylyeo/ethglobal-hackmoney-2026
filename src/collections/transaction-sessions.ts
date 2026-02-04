/**
 * Transaction sessions collection.
 * Persists to localStorage across sessions.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'
import { DataSource } from '$/constants/data-sources'
import type { TransactionSession } from '$/data/TransactionSession'

export type TransactionSessionRow = TransactionSession & { $source: DataSource }

export const transactionSessionsCollection = createCollection(
	localStorageCollectionOptions({
		id: 'transaction-sessions',
		storageKey: 'transaction-sessions',
		getKey: (row: TransactionSessionRow) => row.id,
		parser: { stringify, parse },
	}),
)

