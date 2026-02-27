/**
 * Transaction traces from RPC debug_traceTransaction (callTracer).
 * Cached per chainId:txHash. Many public RPCs do not support it; store null as unavailable.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { fetchTracesForTransactionFromSqd } from '$/api/sqd.ts'
import {
	debugTraceTransaction,
	rawTraceToTrace,
	type RawTrace,
} from '$/api/voltaire.ts'
import { SQD_DATASETS_BY_CHAIN_ID } from '$/constants/sqd-datasets.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId } from '$/constants/data-sources.ts'
import type { ChainId } from '$/constants/networks.ts'
import { normalizeTxHash } from '$/collections/NetworkTransactions.ts'
import { createProviderForChain, getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'
import type {
	TransactionTraceEntry,
	TransactionTrace$Id,
} from '$/data/TransactionTrace.ts'

const getKey = (trace: TransactionTraceRow) =>
	`${trace.$id.$network.chainId}:${normalizeTxHash(trace.$id.txHash)}`

export type TransactionTraceRow = TransactionTraceEntry & {
	$source: DataSourceId
	unavailable?: boolean
	isLoading?: boolean
	error?: string | null
}

export const transactionTracesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.TransactionTraces,
		storageKey: CollectionId.TransactionTraces,
		getKey: (trace: TransactionTraceRow) => getKey(trace),
		parser: { stringify, parse },
	}),
)

export async function fetchTransactionTrace(
	chainId: ChainId,
	txHash: `0x${string}`,
	opts?: { blockNumber?: number },
): Promise<void> {
	const key = `${chainId}:${normalizeTxHash(txHash)}` as unknown as Parameters<
		typeof transactionTracesCollection.state.get
	>[0]

	const existing = transactionTracesCollection.state.get(key)
	if (existing) {
		transactionTracesCollection.update(key, (draft) => {
			draft.isLoading = true
			draft.error = null
		})
	}

	const blockNumber = opts?.blockNumber
	if (
		SQD_DATASETS_BY_CHAIN_ID[chainId]?.traces === true &&
		blockNumber != null &&
		blockNumber > 0
	) {
		try {
			const trace = await fetchTracesForTransactionFromSqd(
				chainId,
				blockNumber,
				txHash,
			)
			if (trace != null) {
				const item: TransactionTraceRow = {
					$id: { $network: { chainId }, txHash },
					trace,
					$source: DataSourceId.Sqd,
					unavailable: false,
					isLoading: false,
					error: null,
				}
				if (existing) {
					transactionTracesCollection.update(key, (draft) => {
						Object.assign(draft, item)
					})
				} else {
					transactionTracesCollection.insert(item)
				}
				return
			}
		} catch {
			/* fall through to Voltaire */
		}
	}

	const url = getEffectiveRpcUrl(chainId)
	if (!url) {
		if (existing)
			transactionTracesCollection.update(key, (draft) => {
				draft.isLoading = false
				draft.error = `No RPC URL for chain ${chainId}`
			})
		throw new Error(`No RPC URL for chain ${chainId}`)
	}

	try {
		const provider = createProviderForChain(chainId)
		const raw = await debugTraceTransaction(provider, txHash)
		if (raw == null) {
			const item: TransactionTraceRow = {
				$id: { $network: { chainId }, txHash },
				$source: DataSourceId.Voltaire,
				unavailable: true,
				isLoading: false,
				error: null,
			}
			if (existing) {
				transactionTracesCollection.update(key, (draft) => {
					Object.assign(draft, item)
				})
			} else {
				transactionTracesCollection.insert(item)
			}
			return
		}
		const trace = rawTraceToTrace(raw as RawTrace)
		const item: TransactionTraceRow = {
			$id: { $network: { chainId }, txHash },
			trace,
			$source: DataSourceId.Voltaire,
			unavailable: false,
			isLoading: false,
			error: null,
		}
		if (existing) {
			transactionTracesCollection.update(key, (draft) => {
				Object.assign(draft, item)
			})
		} else {
			transactionTracesCollection.insert(item)
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		if (existing)
			transactionTracesCollection.update(key, (draft) => {
				draft.isLoading = false
				draft.error = message
			})
		throw e
	}
}
