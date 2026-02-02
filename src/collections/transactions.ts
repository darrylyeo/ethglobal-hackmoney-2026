/**
 * Transaction history collection.
 * Persists to localStorage across sessions.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'

export type Transaction$id = {
	address: `0x${string}`
	sourceTxHash: string
	createdAt: number
}

export type TransactionRow = {
	$id: Transaction$id
	fromChainId: number
	toChainId: number
	fromAmount: bigint
	toAmount: bigint
	destTxHash: string | null
	status: 'pending' | 'completed' | 'failed'
	updatedAt: number
}

export const transactionsCollection = createCollection(
	localStorageCollectionOptions({
		id: 'transactions',
		storageKey: 'bridge-transactions',
		getKey: (row: TransactionRow) => stringify(row.$id),
		parser: { stringify, parse },
	}),
)

export const getTransaction = ($id: Transaction$id) =>
	transactionsCollection.state.get(stringify($id))

export const insertTransaction = (tx: Omit<TransactionRow, 'updatedAt'>) =>
	transactionsCollection.insert({ ...tx, updatedAt: Date.now() })

export const updateTransaction = (
	$id: Transaction$id,
	changes: Partial<Pick<TransactionRow, 'status' | 'destTxHash'>>,
) => {
	const existing = transactionsCollection.state.get(stringify($id))
	if (!existing) return
	transactionsCollection.update(stringify($id), (draft) => {
		if (changes.status !== undefined) draft.status = changes.status
		if (changes.destTxHash !== undefined) draft.destTxHash = changes.destTxHash
		draft.updatedAt = Date.now()
	})
}
