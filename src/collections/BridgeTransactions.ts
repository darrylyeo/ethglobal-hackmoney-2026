/**
 * Bridge transaction history collection.
 * Persists to localStorage across sessions.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import type { Transaction, Transaction$Id } from '$/data/Transaction.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export const bridgeTransactionsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.BridgeTransactions,
		storageKey: CollectionId.BridgeTransactions,
		getKey: (row: WithSource<Transaction>) => stringify(row.$id),
		parser: { parse, stringify },
	}),
)

export const getTransaction = ($id: Transaction$Id) =>
	bridgeTransactionsCollection.state.get(stringify($id))

export const insertTransaction = (tx: Omit<Transaction, 'updatedAt'>) =>
	bridgeTransactionsCollection.insert({
		...tx,
		updatedAt: Date.now(),
	})

export const updateTransaction = (
	$id: Transaction$Id,
	changes: Partial<Pick<WithSource<Transaction>, 'status' | 'destTxHash'>>,
) => {
	const existing = bridgeTransactionsCollection.state.get(stringify($id))
	if (!existing) return
	bridgeTransactionsCollection.update(stringify($id), (draft) => {
		draft.$source = DataSourceId.Local
		if (changes.status !== undefined) draft.status = changes.status
		if (changes.destTxHash !== undefined) draft.destTxHash = changes.destTxHash
		draft.updatedAt = Date.now()
	})
}

export const upsertTransaction = (tx: Omit<Transaction, 'updatedAt'>) => {
	const key = stringify(tx.$id)
	const existing = bridgeTransactionsCollection.state.get(key)
	if (existing) {
		bridgeTransactionsCollection.update(key, (draft) => {
			draft.status = tx.status
			draft.destTxHash = tx.destTxHash ?? draft.destTxHash
			draft.updatedAt = Date.now()
		})
	} else {
		insertTransaction(tx)
	}
}
