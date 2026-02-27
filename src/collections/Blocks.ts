/**
 * Blocks fetched by chain+blockNumber via Voltaire eth_getBlockByNumber.
 * Cached for block page and graph display. Persisted to localStorage.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import {
	getBlockByNumber,
	getBlockTransactionCount,
	getBlockTransactionHashes,
	getCurrentBlockNumber,
} from '$/api/voltaire.ts'
import { fetchNetworkTransaction } from '$/collections/NetworkTransactions.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId } from '$/constants/data-sources.ts'
import {
	type ChainId,
	type Network,
	networksByChainId,
} from '$/constants/networks.ts'
import { createProviderForChain, getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'
import type { BlockEntry, Block$Id } from '$/data/Block.ts'
import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'

export type BlockRow = BlockEntry & {
	$source: DataSourceId
	isLoading?: boolean
	error?: string | null
}

/** BlockEntry.timestamp is always Unix ms. RPC returns seconds; normalize at ingest. */
const toTimestampMs = (t: number): number => (t < 1e12 ? t * 1000 : t)

export const blocksCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.Blocks,
		storageKey: CollectionId.Blocks,
		getKey: (block: BlockRow) => `${block.$id.$network.chainId}:${block.$id.blockNumber}`,
		parser: { stringify, parse },
	}),
)

export function blocksViewFrom(
	chainId: ChainId,
	queryData: { row: BlockEntry }[],
): {
	blocksMap: Map<BlockEntry | undefined, Set<ChainTransactionEntry>>
	networkData: Map<
		Network | undefined,
		Map<BlockEntry | undefined, Set<ChainTransactionEntry>>
	>
} {
	const blocksMap = new Map<
		BlockEntry | undefined,
		Set<ChainTransactionEntry>
	>()
	for (const { row: block } of queryData) blocksMap.set(block, new Set())
	const network = networksByChainId[chainId] ?? undefined
	return {
		blocksMap,
		networkData: new Map([[network, blocksMap]]),
	}
}

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

/** Fetch current block number from RPC and upsert latest block (and recent range) into DB. UI should read latest from blocksCollection via live query. */
export async function ensureLatestBlockForChain(
	chainId: ChainId,
): Promise<void> {
	const url = getEffectiveRpcUrl(chainId)
	if (!url) return
	const provider = createProviderForChain(chainId)
	const num = await getCurrentBlockNumber(provider)
	const lo = Math.max(0, num - 10)
	ensureBlocksForPlaceholders(
		chainId,
		Array.from({ length: num - lo + 1 }, (_, j) => lo + j),
	)
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
	}

	const url = getEffectiveRpcUrl(chainId)
	if (!url) {
		if (existing)
			blocksCollection.update(key, (draft) => {
				draft.isLoading = false
				draft.error = `No RPC URL for chain ${chainId}`
			})
		throw new Error(`No RPC URL for chain ${chainId}`)
	}

	try {
		const provider = createProviderForChain(chainId)
		const blockNum =
			blockNumber >= 0 ? BigInt(blockNumber) : ('latest' as const)
		const [block, transactionCount] = await Promise.all([
			getBlockByNumber(provider, blockNum),
			getBlockTransactionCount(provider, blockNum),
		])
		const blockRow: BlockRow = {
			$id: { $network: { chainId }, blockNumber },
			number: block.number,
			hash: block.hash,
			parentHash: block.parentHash,
			timestamp: toTimestampMs(block.timestamp),
			miner: block.miner,
			gasUsed: block.gasUsed,
			gasLimit: block.gasLimit,
			baseFeePerGas: block.baseFeePerGas,
			transactionCount,
			$source: DataSourceId.Voltaire,
			isLoading: false,
			error: null,
		}
		if (existing) {
			blocksCollection.update(key, (draft) => {
				Object.assign(draft, {
					number: blockRow.number,
					hash: blockRow.hash,
					parentHash: blockRow.parentHash,
					timestamp: blockRow.timestamp,
					miner: blockRow.miner,
					gasUsed: blockRow.gasUsed,
					gasLimit: blockRow.gasLimit,
					baseFeePerGas: blockRow.baseFeePerGas,
					transactionCount,
					isLoading: false,
					error: null,
				})
			})
		} else {
			blocksCollection.insert(blockRow)
		}
		return {
			$id: { $network: { chainId }, blockNumber },
			number: blockRow.number,
			hash: blockRow.hash,
			parentHash: blockRow.parentHash,
			timestamp: blockRow.timestamp,
			miner: blockRow.miner,
			gasUsed: blockRow.gasUsed,
			gasLimit: blockRow.gasLimit,
			baseFeePerGas: blockRow.baseFeePerGas,
			transactionCount,
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		if (existing)
			blocksCollection.update(key, (draft) => {
				draft.isLoading = false
				draft.error = message
			})
		throw e
	}
}

/** Fetch transaction hashes for a block, then upsert each into networkTransactionsCollection. */
export const fetchBlockTransactions = async (
	chainId: ChainId,
	blockNumber: number,
): Promise<void> => {
	const url = getEffectiveRpcUrl(chainId)
	if (!url) return
	const provider = createProviderForChain(chainId)
	const hashes = await getBlockTransactionHashes(provider, BigInt(blockNumber))
	await Promise.allSettled(
		hashes.map((hash) => fetchNetworkTransaction(chainId, hash)),
	)
}
