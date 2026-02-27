/**
 * Network transactions fetched by chainId+txHash via Voltaire eth_getTransactionByHash + eth_getTransactionReceipt.
 * Persisted (profile- and network-env–scoped) when associated with session flows or network/block browsing (Spec 063).
 */

import {
	getTransactionByHash,
	getTransactionReceipt,
} from '$/api/voltaire.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId } from '$/constants/data-sources.ts'
import type { ChainId } from '$/constants/networks.ts'
import { normalizeAddress } from '$/lib/address.ts'
import { createProviderForChain, getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'
import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

/** Normalize tx hash to lowercase for consistent cache keys. Use at route/API boundary. */
export const normalizeTxHash = (h: `0x${string}`): `0x${string}` =>
	h.slice(0, 2) + h.slice(2).toLowerCase() as `0x${string}`

const getKey = (tx: ChainTransactionEntry) =>
	`${tx.$id.$network.chainId}:${normalizeTxHash(tx.$id.txHash)}`

export type ChainTransactionRow = ChainTransactionEntry & {
	$source: DataSourceId
	isLoading?: boolean
	error?: string | null
}

export const networkTransactionsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.NetworkTransactions,
		storageKey: CollectionId.NetworkTransactions,
		getKey: (tx: ChainTransactionRow) => getKey(tx),
		parser: { stringify, parse },
	}),
)

export const fetchNetworkTransaction = async (
	chainId: ChainId,
	txHash: `0x${string}`,
): Promise<ChainTransactionEntry> => {
	const normalized = normalizeTxHash(txHash)
	const key = `${chainId}:${normalized}`
	const existing = networkTransactionsCollection.state.get(key)
	if (existing) {
		networkTransactionsCollection.update(key, (draft) => {
			draft.isLoading = true
			draft.error = null
		})
	}

	const url = getEffectiveRpcUrl(chainId)
	if (!url) {
		if (existing)
			networkTransactionsCollection.update(key, (draft) => {
				draft.isLoading = false
				draft.error = `No RPC URL for chain ${chainId}`
			})
		throw new Error(`No RPC URL for chain ${chainId}`)
	}

	try {
		const provider = createProviderForChain(chainId)
		const [tx, receipt] = await Promise.all([
			getTransactionByHash(provider, txHash),
			getTransactionReceipt(provider, txHash),
		])
		if (!tx) {
			if (existing)
				networkTransactionsCollection.update(key, (draft) => {
					draft.isLoading = false
					draft.error = 'Transaction not found'
				})
			throw new Error('Transaction not found')
		}
		const txRow: ChainTransactionRow = {
			$id: { $network: { chainId }, txHash: normalized },
			blockNumber: parseInt(tx.blockNumber, 16),
			blockHash: tx.blockHash,
			transactionIndex: parseInt(tx.transactionIndex, 16),
			from: (normalizeAddress(tx.from as `0x${string}`) ?? tx.from),
			to: tx.to ? (normalizeAddress(tx.to as `0x${string}`) ?? tx.to) : null,
			value: tx.value,
			nonce: parseInt(tx.nonce, 16),
			input: tx.input,
			gas: BigInt(tx.gas),
			gasPrice: BigInt(tx.gasPrice),
			type: tx.type ? parseInt(tx.type, 16) : undefined,
			status: receipt ? parseInt(receipt.status, 16) : undefined,
			gasUsed: receipt ? BigInt(receipt.gasUsed) : undefined,
			contractAddress: receipt?.contractAddress
				? (normalizeAddress(receipt.contractAddress as `0x${string}`) ?? receipt.contractAddress)
				: null,
			effectiveGasPrice: receipt?.effectiveGasPrice ? BigInt(receipt.effectiveGasPrice) : undefined,
			logs: receipt?.logs ?? [],
			$source: DataSourceId.Voltaire,
			isLoading: false,
			error: null,
		}
		if (existing) {
			networkTransactionsCollection.update(key, (draft) => {
				Object.assign(draft, {
					blockNumber: txRow.blockNumber,
					blockHash: txRow.blockHash,
					transactionIndex: txRow.transactionIndex,
					from: txRow.from,
					to: txRow.to,
					value: txRow.value,
					nonce: txRow.nonce,
					input: txRow.input,
					gas: txRow.gas,
					gasPrice: txRow.gasPrice,
					type: txRow.type,
					status: txRow.status,
					gasUsed: txRow.gasUsed,
					contractAddress: txRow.contractAddress,
					effectiveGasPrice: txRow.effectiveGasPrice,
					logs: txRow.logs,
					isLoading: false,
					error: null,
				})
			})
		} else {
			networkTransactionsCollection.insert(txRow)
		}
		return {
			$id: txRow.$id,
			blockNumber: txRow.blockNumber,
			blockHash: txRow.blockHash,
			transactionIndex: txRow.transactionIndex,
			from: txRow.from,
			to: txRow.to,
			value: txRow.value,
			nonce: txRow.nonce,
			input: txRow.input,
			gas: txRow.gas,
			gasPrice: txRow.gasPrice,
			type: txRow.type,
			status: txRow.status,
			gasUsed: txRow.gasUsed,
			contractAddress: txRow.contractAddress,
			effectiveGasPrice: txRow.effectiveGasPrice,
			logs: txRow.logs,
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		if (existing)
			networkTransactionsCollection.update(key, (draft) => {
				draft.isLoading = false
				draft.error = message
			})
		throw e
	}
}
