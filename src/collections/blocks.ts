/**
 * Blocks fetched by chain+blockNumber via Voltaire eth_getBlockByNumber.
 * Cached for block page and graph display.
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import type { ChainId } from '$/constants/networks'
import { rpcUrls } from '$/constants/rpc-endpoints'
import type { BlockEntry, Block$Id } from '$/data/Block'
import {
	createHttpProvider,
	getBlockByNumber,
	getBlockTransactionCount,
} from '$/api/voltaire'

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
		const key = `${chainId}:${blockNumber}`
		if (!blocksCollection.state.get(key))
			fetchBlock(chainId, blockNumber).catch(() => {})
	}
}

export const fetchBlock = async (
	chainId: ChainId,
	blockNumber: number,
): Promise<BlockEntry> => {
	const key = `${chainId}:${blockNumber}`
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
			timestamp: block.timestamp,
			transactionCount,
			$source: DataSource.Voltaire,
			isLoading: false,
			error: null,
		}
		blocksCollection.update(key, (draft) => {
			draft.number = row.number
			draft.timestamp = row.timestamp
			draft.transactionCount = transactionCount
			draft.isLoading = false
			draft.error = null
		})
		return {
			$id: row.$id,
			number: row.number,
			timestamp: row.timestamp,
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
