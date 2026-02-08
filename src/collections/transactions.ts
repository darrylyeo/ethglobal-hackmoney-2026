/**
 * Transaction history collection.
 * Persists to localStorage across sessions.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { Transaction, Transaction$Id } from '$/data/Transaction.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { getTransactions } from '$/lib/txHistory.ts'

export type TransactionRow = Transaction & { $source: DataSource }

export const transactionsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.Transactions,
		storageKey: CollectionId.BridgeTransactions,
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

export const upsertTransaction = (tx: Omit<Transaction, 'updatedAt'>) => {
	const key = stringify(tx.$id)
	const existing = transactionsCollection.state.get(key)
	if (existing) {
		transactionsCollection.update(key, (draft) => {
			draft.$source = DataSource.Local
			draft.status = tx.status
			draft.destTxHash = tx.destTxHash ?? draft.destTxHash
			draft.updatedAt = Date.now()
		})
	} else {
		insertTransaction(tx)
	}
}

/**
 * Migrate legacy per-address tx history (bridge-tx-history-${address}) into
 * transactionsCollection and upsert. Idempotent; safe to call when querying by address.
 */
export const migrateLegacyTxHistoryForAddress = (
	address: `0x${string}`,
): void => {
	const legacy = getTransactions(address)
	for (const t of legacy) {
		upsertTransaction({
			$id: {
				address: t.address,
				sourceTxHash: t.sourceTxHash,
				createdAt: t.createdAt,
			},
			fromChainId: t.fromChainId,
			toChainId: t.toChainId,
			fromAmount: BigInt(t.fromAmount),
			toAmount: BigInt(t.toAmount),
			destTxHash: t.destTxHash ?? null,
			status: t.status,
		})
	}
}

/**
 * Trigger migration from legacy tx history for each address. Call when transactions
 * are queried (e.g. Transactions view with actors) so the collection stays in sync.
 */
export const ensureTransactionsForAddresses = (
	addresses: `0x${string}`[],
): void => {
	for (const address of addresses) {
		migrateLegacyTxHistoryForAddress(address)
	}
}
