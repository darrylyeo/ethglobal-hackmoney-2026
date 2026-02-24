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
import { DataSource } from '$/constants/data-sources.ts'
import type { ChainId } from '$/constants/networks.ts'
import { normalizeTxHash } from '$/collections/NetworkTransactions.ts'
import { createProviderForChain, getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'
import type {
	TransactionTraceEntry,
	TransactionTrace$Id,
} from '$/data/TransactionTrace.ts'

const getKey = (row: TransactionTraceRow) =>
	`${row.$id.$network.chainId}:${normalizeTxHash(row.$id.txHash)}`

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
				const row: TransactionTraceRow = {
					$id: { $network: { chainId }, txHash },
					trace,
					$source: DataSource.Sqd,
					unavailable: false,
					isLoading: false,
					error: null,
				}
				if (existing) {
					transactionTracesCollection.update(key, (draft) => {
						Object.assign(draft, row)
					})
				} else {
					transactionTracesCollection.insert(row)
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
			const row: TransactionTraceRow = {
				$id: { $network: { chainId }, txHash },
				$source: DataSource.Voltaire,
				unavailable: true,
				isLoading: false,
				error: null,
			}
			if (existing) {
				transactionTracesCollection.update(key, (draft) => {
					Object.assign(draft, row)
				})
			} else {
				transactionTracesCollection.insert(row)
			}
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
		if (existing) {
			transactionTracesCollection.update(key, (draft) => {
				Object.assign(draft, row)
			})
		} else {
			transactionTracesCollection.insert(row)
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
