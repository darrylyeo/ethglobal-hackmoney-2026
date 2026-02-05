/**
 * Chain transactions fetched by chainId+txHash via Voltaire eth_getTransactionByHash + eth_getTransactionReceipt.
 * Used by network/block/transaction browsing (Spec 063).
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import type { ChainId } from '$/constants/networks'
import { rpcUrls } from '$/constants/rpc-endpoints'
import type {
	ChainTransactionEntry,
	ChainTransaction$Id,
} from '$/data/ChainTransaction'
import {
	createHttpProvider,
	getTransactionByHash,
	getTransactionReceipt,
} from '$/api/voltaire'

const getKey = (row: ChainTransactionEntry) =>
	`${row.$id.chainId}:${row.$id.txHash}`

export type ChainTransactionRow = ChainTransactionEntry & {
	$source: DataSource
	isLoading?: boolean
	error?: string | null
}

export const chainTransactionsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'chain-transactions',
		getKey: (row: ChainTransactionRow) => getKey(row),
	}),
)

export const fetchChainTransaction = async (
	chainId: ChainId,
	txHash: `0x${string}`,
): Promise<ChainTransactionEntry> => {
	const key = `${chainId}:${txHash}`
	const existing = chainTransactionsCollection.state.get(key)

	if (existing) {
		chainTransactionsCollection.update(key, (draft) => {
			draft.isLoading = true
			draft.error = null
		})
	} else {
		chainTransactionsCollection.insert({
			$id: { chainId, txHash },
			blockNumber: 0,
			blockHash: '',
			from: '',
			to: null,
			value: '0x0',
			logs: [],
			$source: DataSource.Voltaire,
			isLoading: true,
			error: null,
		})
	}

	const url = rpcUrls[chainId]
	if (!url) {
		const err = `No RPC URL for chain ${chainId}`
		chainTransactionsCollection.update(key, (draft) => {
			draft.isLoading = false
			draft.error = err
		})
		throw new Error(err)
	}

	try {
		const provider = createHttpProvider(url)
		const [tx, receipt] = await Promise.all([
			getTransactionByHash(provider, txHash),
			getTransactionReceipt(provider, txHash),
		])
		if (!tx) {
			chainTransactionsCollection.update(key, (draft) => {
				draft.isLoading = false
				draft.error = 'Transaction not found'
			})
			throw new Error('Transaction not found')
		}
		const row: ChainTransactionRow = {
			$id: { chainId, txHash },
			blockNumber: parseInt(tx.blockNumber, 16),
			blockHash: tx.blockHash,
			from: tx.from,
			to: tx.to,
			value: tx.value,
			logs: receipt?.logs ?? [],
			$source: DataSource.Voltaire,
			isLoading: false,
			error: null,
		}
		chainTransactionsCollection.update(key, (draft) => {
			Object.assign(draft, {
				blockNumber: row.blockNumber,
				blockHash: row.blockHash,
				from: row.from,
				to: row.to,
				value: row.value,
				logs: row.logs,
				isLoading: false,
				error: null,
			})
		})
		return {
			$id: row.$id,
			blockNumber: row.blockNumber,
			blockHash: row.blockHash,
			from: row.from,
			to: row.to,
			value: row.value,
			logs: row.logs,
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		chainTransactionsCollection.update(key, (draft) => {
			draft.isLoading = false
			draft.error = message
		})
		throw e
	}
}
