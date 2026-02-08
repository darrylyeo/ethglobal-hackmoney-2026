import { CollectionId } from '$/constants/collections.ts'
import type { SessionActionTransaction } from '$/data/SessionActionTransaction.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type SessionActionTransactionRow = SessionActionTransaction

export const sessionActionTransactionsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.SessionActionTransactions,
		storageKey: CollectionId.SessionActionTransactions,
		getKey: (row: SessionActionTransactionRow) => row.id,
		parser: { stringify, parse },
	}),
)
