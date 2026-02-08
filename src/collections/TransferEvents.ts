/**
 * Transfer events per symbol+period from Voltaire eth_getLogs.
 * Fetched and upserted for the coin page; list reads from this collection.
 */

import type { NormalizedTransferEvent } from '$/api/transfers-logs.ts'
import { fetchTransferEventsForPeriod } from '$/api/transfers-logs.ts'
import type { CoinPageSymbol } from '$/constants/coins.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type TransferEvent$Id = {
	symbol: string
	period: string
	chainId: number
	blockNumber: number
	logIndex: number
}

export type TransferEventRow = {
	$id: TransferEvent$Id
	$source: DataSource
} & NormalizedTransferEvent

export type TransferEventsMetaRow = {
	$id: {
		symbol: string
		period: string
		chainId: -1
		blockNumber: -1
		logIndex: -1
	}
	$source: DataSource
	isLoading: boolean
	error: string | null
}

function getKey(row: TransferEventRow | TransferEventsMetaRow): string {
	const { symbol, period, chainId, blockNumber, logIndex } = row.$id
	return (chainId as number) === -1
		? `${symbol}:${period}:meta`
		: `${symbol}:${period}:${chainId}:${blockNumber}:${logIndex}`
}

export const transferEventsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.TransferEvents,
		getKey,
	}),
)

export const ensureTransferEventsForPlaceholders = (
	symbol: CoinPageSymbol,
	period: string,
	placeholderKeys: string[],
): void => {
	const missing = placeholderKeys.some(
		(key) => !transferEventsCollection.state.get(key),
	)
	if (missing) fetchTransferEvents(symbol, period).catch(() => {})
}

export async function fetchTransferEvents(
	symbol: CoinPageSymbol,
	period: string,
): Promise<TransferEventRow[]> {
	const metaKey = `${symbol}:${period}:meta`
	const existingMeta = transferEventsCollection.state.get(metaKey)
	if (existingMeta && 'isLoading' in existingMeta) {
		transferEventsCollection.update(metaKey, (draft) => {
			;(draft as TransferEventsMetaRow).isLoading = true
			;(draft as TransferEventsMetaRow).error = null
		})
	} else {
		transferEventsCollection.insert({
			$id: { symbol, period, chainId: -1, blockNumber: -1, logIndex: -1 },
			$source: DataSource.Voltaire,
			isLoading: true,
			error: null,
		} as TransferEventsMetaRow)
	}

	if (symbol !== 'USDC') {
		transferEventsCollection.update(metaKey, (draft) => {
			;(draft as TransferEventsMetaRow).isLoading = false
			;(draft as TransferEventsMetaRow).error = null
		})
		return []
	}

	try {
		const events = await fetchTransferEventsForPeriod(period)
		for (const e of events) {
			const key = `${symbol}:${period}:${e.chainId}:${e.blockNumber}:${e.logIndex}`
			const existing = transferEventsCollection.state.get(key)
			const row: TransferEventRow = {
				$id: {
					symbol,
					period,
					chainId: e.chainId,
					blockNumber: e.blockNumber,
					logIndex: e.logIndex,
				},
				$source: DataSource.Voltaire,
				transactionHash: e.transactionHash,
				fromAddress: e.fromAddress,
				toAddress: e.toAddress,
				amount: e.amount,
				timestamp: e.timestamp,
				chainId: e.chainId,
				blockNumber: e.blockNumber,
				logIndex: e.logIndex,
			}
			if (existing)
				transferEventsCollection.update(key, (draft) => {
					Object.assign(draft, row)
				})
			else transferEventsCollection.insert(row)
		}
		transferEventsCollection.update(metaKey, (draft) => {
			;(draft as TransferEventsMetaRow).isLoading = false
			;(draft as TransferEventsMetaRow).error = null
		})
		return events.map((e) => ({
			$id: {
				symbol,
				period,
				chainId: e.chainId,
				blockNumber: e.blockNumber,
				logIndex: e.logIndex,
			},
			$source: DataSource.Voltaire,
			...e,
		})) as TransferEventRow[]
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		transferEventsCollection.update(metaKey, (draft) => {
			;(draft as TransferEventsMetaRow).isLoading = false
			;(draft as TransferEventsMetaRow).error = message
		})
		throw e
	}
}

export function transferEventsQueryKey(
	period: string,
): readonly [string, string] {
	return ['transfer-events', period] as const
}
