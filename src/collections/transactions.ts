/**
 * Transaction history collection.
 * Persists to localStorage across sessions.
 */

import { DataSource } from '$/constants/data-sources.ts'
import type { Transaction, Transaction$Id } from '$/data/Transaction.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type TransactionRow = Transaction & { $source: DataSource }

export const transactionsCollection = createCollection(
	localStorageCollectionOptions({
		id: 'transactions',
		storageKey: 'bridge-transactions',
		getKey: (row: TransactionRow) => stringify(row.$id),
		parser: { parse, stringify },
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
