/**
 * Blocks fetched by chain+blockNumber via Voltaire eth_getBlockByNumber.
 * Cached for block page and graph display.
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import {
	createHttpProvider,
	getBlockByNumber,
	getBlockTransactionCount,
	getBlockTransactionHashes,
} from '$/api/voltaire.ts'
import { fetchChainTransaction } from '$/collections/chain-transactions.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { ChainId } from '$/constants/networks.ts'
import { rpcUrls } from '$/constants/rpc-endpoints.ts'
import type { BlockEntry, Block$Id } from '$/data/Block.ts'

export type BlockRow = BlockEntry & {
	$source: DataSource
	isLoading?: boolean
	error?: string | null
}

export const blocksCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'blocks',
		getKey: (row: BlockRow) => `${row.$id.chainId}:${row.$id.blockNumber}`,
	}),
)

export const ensureBlocksForPlaceholders = (
	chainId: ChainId,
	blockNumbers: number[],
): void => {
	for (const blockNumber of blockNumbers) {
		const key = `${chainId}:${blockNumber}` as unknown as Parameters<
			typeof blocksCollection.state.get
		>[0]
		if (!blocksCollection.state.get(key))
			fetchBlock(chainId, blockNumber).catch(() => {})
	}
}

export const fetchBlock = async (
	chainId: ChainId,
	blockNumber: number,
): Promise<BlockEntry> => {
	const key = `${chainId}:${blockNumber}` as unknown as Parameters<
		typeof blocksCollection.state.get
	>[0]
	const existing = blocksCollection.state.get(key)

	if (existing) {
		blocksCollection.update(key, (draft) => {
			draft.isLoading = true
			draft.error = null
		})
	} else {
		blocksCollection.insert({
			$id: { chainId, blockNumber },
			number: BigInt(blockNumber),
			timestamp: 0,
			$source: DataSource.Voltaire,
			isLoading: true,
			error: null,
		})
	}

	const url = rpcUrls[chainId]
	if (!url) {
		const err = `No RPC URL for chain ${chainId}`
		blocksCollection.update(key, (draft) => {
			draft.isLoading = false
			draft.error = err
		})
		throw new Error(err)
	}

	try {
		const provider = createHttpProvider(url)
		const blockNum =
			blockNumber >= 0 ? BigInt(blockNumber) : ('latest' as const)
		const [block, transactionCount] = await Promise.all([
			getBlockByNumber(provider, blockNum),
			getBlockTransactionCount(provider, blockNum),
		])
		const row: BlockRow = {
			$id: { chainId, blockNumber },
			number: block.number,
			hash: block.hash,
			parentHash: block.parentHash,
			timestamp: block.timestamp,
			miner: block.miner,
			gasUsed: block.gasUsed,
			gasLimit: block.gasLimit,
			baseFeePerGas: block.baseFeePerGas,
			transactionCount,
			$source: DataSource.Voltaire,
			isLoading: false,
			error: null,
		}
		blocksCollection.update(key, (draft) => {
			Object.assign(draft, {
				number: row.number,
				hash: row.hash,
				parentHash: row.parentHash,
				timestamp: row.timestamp,
				miner: row.miner,
				gasUsed: row.gasUsed,
				gasLimit: row.gasLimit,
				baseFeePerGas: row.baseFeePerGas,
				transactionCount,
				isLoading: false,
				error: null,
			})
		})
		return {
			$id: row.$id,
			number: row.number,
			hash: row.hash,
			parentHash: row.parentHash,
			timestamp: row.timestamp,
			miner: row.miner,
			gasUsed: row.gasUsed,
			gasLimit: row.gasLimit,
			baseFeePerGas: row.baseFeePerGas,
			transactionCount,
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		blocksCollection.update(key, (draft) => {
			draft.isLoading = false
			draft.error = message
		})
		throw e
	}
}

/** Fetch transaction hashes for a block, then upsert each into chainTransactionsCollection. */
export const fetchBlockTransactions = async (
	chainId: ChainId,
	blockNumber: number,
): Promise<void> => {
	const url = rpcUrls[chainId]
	if (!url) return
	const provider = createHttpProvider(url)
	const hashes = await getBlockTransactionHashes(provider, BigInt(blockNumber))
	await Promise.allSettled(
		hashes.map((hash) => fetchChainTransaction(chainId, hash)),
	)
}
