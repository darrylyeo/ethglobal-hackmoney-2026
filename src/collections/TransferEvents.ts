/**
 * Transfer events per symbol+period. Single RPC fetch; TanStack DB cache.
 * Graph is derived from events and written to TransferGraphs (no extra fetch).
 */

import type { NormalizedTransferEvent } from '$/api/transfers-logs.ts'
import { fetchTransferEventsForPeriod } from '$/api/transfers-logs.ts'
import type { CoinId } from '$/constants/coins.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import type { Network$Id } from '$/data/Network.ts'
import { upsertBridgeTransferEvents } from '$/collections/BridgeTransferEvents.ts'
import { upsertSwapTransferEvents } from '$/collections/SwapTransferEvents.ts'
import { upsertGraphFromEvents } from '$/collections/TransferGraphs.ts'

export type TransferEvent$Id = {
	$network: Network$Id
	symbol: string
	period: string
	blockNumber: number
	logIndex: number
}

export type TransferEventRow = {
	$id: TransferEvent$Id
	$source: DataSource
} & NormalizedTransferEvent

export type TransferEventsMetaRow = {
	$id: {
		$network: { chainId: -1 }
		symbol: string
		period: string
		blockNumber: -1
		logIndex: -1
	}
	$source: DataSource
	isLoading: boolean
	error: string | null
}

function getKey(row: TransferEventRow | TransferEventsMetaRow): string {
	const { $network, symbol, period, blockNumber, logIndex } = row.$id
	const chainId = $network.chainId
	return (chainId as number) === -1
		? `${symbol}:${period}:meta`
		: `${symbol}:${period}:${chainId}:${blockNumber}:${logIndex}`
}

export const transferEventsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.TransferEvents,
		storageKey: CollectionId.TransferEvents,
		getKey,
		parser: { stringify, parse },
	}),
)

const inFlight = new Map<string, Promise<TransferEventRow[]>>()

function hasValidCache(metaKey: string): boolean {
	const meta = transferEventsCollection.state.get(metaKey) as
		| TransferEventsMetaRow
		| undefined
	return !!(
		meta &&
		'isLoading' in meta &&
		!meta.isLoading &&
		meta.error === null
	)
}

export const ensureTransferEventsForPlaceholders = (
	coinId: CoinId,
	period: string,
	placeholderKeys: string[],
): void => {
	const missing = placeholderKeys.some(
		(key) => !transferEventsCollection.state.get(key),
	)
	if (missing) fetchTransferEvents(coinId, period).catch(() => {})
}

export async function fetchTransferEvents(
	coinId: CoinId,
	period: string,
	options?: { force?: boolean },
): Promise<TransferEventRow[]> {
	const metaKey = `${coinId}:${period}:meta`
	const cacheKey = `${coinId}:${period}`

	if (!options?.force && hasValidCache(metaKey)) {
		const rows = [...transferEventsCollection.state.values()].filter(
			(r): r is TransferEventRow => r.$id.$network.chainId !== -1,
		)
			.filter(
				(r) => r.$id.symbol === coinId && r.$id.period === period,
			) as TransferEventRow[]
		upsertGraphFromEvents(coinId, period, rows)
		upsertBridgeTransferEvents(coinId, period, rows)
		upsertSwapTransferEvents(coinId, period, rows)
		return rows
	}

	const existing = inFlight.get(cacheKey)
	if (existing) return existing

	const run = async (): Promise<TransferEventRow[]> => {
		if (!hasValidCache(metaKey)) {
			const existingMeta = transferEventsCollection.state.get(metaKey)
			if (existingMeta && 'isLoading' in existingMeta)
				transferEventsCollection.update(metaKey, (draft) => {
					;(draft as TransferEventsMetaRow).isLoading = true
					;(draft as TransferEventsMetaRow).error = null
				})
			else
				transferEventsCollection.insert({
					$id: {
						$network: { chainId: -1 },
						symbol: coinId,
						period,
						blockNumber: -1,
						logIndex: -1,
					},
					$source: DataSource.Voltaire,
					isLoading: true,
					error: null,
				} as TransferEventsMetaRow)
		}

		if (coinId !== 'USDC') {
			transferEventsCollection.update(metaKey, (draft) => {
				;(draft as TransferEventsMetaRow).isLoading = false
				;(draft as TransferEventsMetaRow).error = null
			})
			return []
		}

		try {
			const events = await fetchTransferEventsForPeriod(period)
			for (const e of events) {
				const key = `${coinId}:${period}:${e.chainId}:${e.blockNumber}:${e.logIndex}`
				const existingRow = transferEventsCollection.state.get(key)
				const row: TransferEventRow = {
					$id: {
						$network: { chainId: e.chainId },
						symbol: coinId,
						period,
						blockNumber: e.blockNumber,
						logIndex: e.logIndex,
					},
					$source: '$source' in e ? e.$source : DataSource.Voltaire,
					transactionHash: e.transactionHash,
					fromAddress: e.fromAddress,
					toAddress: e.toAddress,
					amount: e.amount,
					timestamp: e.timestamp,
					chainId: e.chainId,
					blockNumber: e.blockNumber,
					logIndex: e.logIndex,
				}
				if (existingRow)
					transferEventsCollection.update(key, (draft) => {
						Object.assign(draft, row)
					})
				else transferEventsCollection.insert(row)
			}
			transferEventsCollection.update(metaKey, (draft) => {
				;(draft as TransferEventsMetaRow).isLoading = false
				;(draft as TransferEventsMetaRow).error = null
			})
			upsertGraphFromEvents(coinId, period, events)
			const rows = events.map((e) => ({
				$id: {
					$network: { chainId: e.chainId },
					symbol: coinId,
					period,
					blockNumber: e.blockNumber,
					logIndex: e.logIndex,
				},
				$source: '$source' in e ? e.$source : DataSource.Voltaire,
				...e,
			})) as TransferEventRow[]
			upsertBridgeTransferEvents(coinId, period, rows)
			upsertSwapTransferEvents(coinId, period, rows)
			return rows
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			transferEventsCollection.update(metaKey, (draft) => {
				;(draft as TransferEventsMetaRow).isLoading = false
				;(draft as TransferEventsMetaRow).error = message
			})
			throw e
		} finally {
			inFlight.delete(cacheKey)
		}
	}

	const promise = run()
	inFlight.set(cacheKey, promise)
	return promise
}

export function transferEventsQueryKey(
	period: string,
): readonly [string, string] {
	return ['transfer-events', period] as const
}
