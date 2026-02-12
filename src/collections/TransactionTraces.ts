/**
 * Transaction traces from RPC debug_traceTransaction (callTracer).
 * Cached per chainId:txHash. Many public RPCs do not support it; store null as unavailable.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import {
	createHttpProvider,
	debugTraceTransaction,
	rawTraceToTrace,
	type RawTrace,
} from '$/api/voltaire.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { ChainId } from '$/constants/networks.ts'
import { rpcUrls } from '$/constants/rpc-endpoints.ts'
import type {
	TransactionTraceEntry,
	TransactionTrace$Id,
} from '$/data/TransactionTrace.ts'

const getKey = (row: TransactionTraceRow) =>
	`${row.$id.$network.chainId}:${row.$id.txHash}`

export type TransactionTraceRow = TransactionTraceEntry & {
	$source: DataSource
	unavailable?: boolean
	isLoading?: boolean
	error?: string | null
}

export const transactionTracesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.TransactionTraces,
		storageKey: CollectionId.TransactionTraces,
		getKey: (row: TransactionTraceRow) => getKey(row),
		parser: { stringify, parse },
	}),
)

export async function fetchTransactionTrace(
	chainId: ChainId,
	txHash: `0x${string}`,
): Promise<void> {
	const key = `${chainId}:${txHash}` as unknown as Parameters<
		typeof transactionTracesCollection.state.get
	>[0]

	if (transactionTracesCollection.state.get(key)) {
		transactionTracesCollection.update(key, (draft) => {
			draft.isLoading = true
			draft.error = null
		})
	} else {
		transactionTracesCollection.insert({
			$id: { $network: { chainId }, txHash },
			trace: { index: 0 },
			$source: DataSource.Voltaire,
			isLoading: true,
			error: null,
		})
	}

	const url = rpcUrls[chainId]
	if (!url) {
		const err = `No RPC URL for chain ${chainId}`
		transactionTracesCollection.update(key, (draft) => {
			draft.isLoading = false
			draft.error = err
		})
		throw new Error(err)
	}

	try {
		const provider = createHttpProvider(url)
		const raw = await debugTraceTransaction(provider, txHash)
		if (raw == null) {
			transactionTracesCollection.update(key, (draft) => {
				Object.assign(draft, {
					trace: undefined,
					unavailable: true,
					isLoading: false,
					error: null,
				})
			})
			return
		}
		const trace = rawTraceToTrace(raw as RawTrace)
		const row: TransactionTraceRow = {
			$id: { $network: { chainId }, txHash },
			trace,
			$source: DataSource.Voltaire,
			unavailable: false,
			isLoading: false,
			error: null,
		}
		transactionTracesCollection.update(key, (draft) => {
			Object.assign(draft, {
				trace: row.trace,
				unavailable: false,
				isLoading: false,
				error: null,
			})
		})
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		transactionTracesCollection.update(key, (draft) => {
			draft.isLoading = false
			draft.error = message
		})
		throw e
	}
}
