/**
 * Transaction history collection.
 * Persists to localStorage across sessions.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'
import { DataSource } from '$/constants/data-sources'
import type { Transaction, Transaction$Id } from '$/data/Transaction'

export type TransactionRow = Transaction & { $source: DataSource }

export const transactionsCollection = createCollection(
	localStorageCollectionOptions({
		id: 'transactions',
		storageKey: 'bridge-transactions',
		getKey: (row: TransactionRow) => stringify(row.$id),
		parser: { stringify, parse },
	}),
)

for (const [key, row] of transactionsCollection.state) {
	if (row.$source !== DataSource.Local) {
		transactionsCollection.update(key, (draft) => {
			draft.$source = DataSource.Local
		})
	}
}

export const getTransaction = ($id: Transaction$Id) =>
	transactionsCollection.state.get(stringify($id))

export const insertTransaction = (tx: Omit<Transaction, 'updatedAt'>) =>
	transactionsCollection.insert({
		...tx,
		$source: DataSource.Local,
		updatedAt: Date.now(),
	})

export const updateTransaction = (
	$id: Transaction$Id,
	changes: Partial<Pick<TransactionRow, 'status' | 'destTxHash'>>,
) => {
	const existing = transactionsCollection.state.get(stringify($id))
	if (!existing) return
	transactionsCollection.update(stringify($id), (draft) => {
		draft.$source = DataSource.Local
		if (changes.status !== undefined) draft.status = changes.status
		if (changes.destTxHash !== undefined) draft.destTxHash = changes.destTxHash
		draft.updatedAt = Date.now()
	})
}
