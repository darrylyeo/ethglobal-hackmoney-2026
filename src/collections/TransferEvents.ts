/**
 * Transfer events per symbol+period. Single RPC fetch; TanStack DB cache.
 * Graph is derived from events and written to TransferGraphs (no extra fetch).
 */

import type { NormalizedTransferEvent } from '$/api/transfers-logs.ts'
import { fetchTransferEventsForPeriod } from '$/api/transfers-logs.ts'
import type { CoinSymbol } from '$/constants/coins.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
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
	localOnlyCollectionOptions({
		id: CollectionId.TransferEvents,
		getKey,
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
	symbol: CoinSymbol,
	period: string,
	placeholderKeys: string[],
): void => {
	const missing = placeholderKeys.some(
		(key) => !transferEventsCollection.state.get(key),
	)
	if (missing) fetchTransferEvents(symbol, period).catch(() => {})
}

export async function fetchTransferEvents(
	symbol: CoinSymbol,
	period: string,
	options?: { force?: boolean },
): Promise<TransferEventRow[]> {
	const metaKey = `${symbol}:${period}:meta`
	const cacheKey = `${symbol}:${period}`

	if (!options?.force && hasValidCache(metaKey)) {
		const rows = [...transferEventsCollection.state.values()]
			.filter(
				(r): r is TransferEventRow =>
					'chainId' in r && (r as TransferEventRow).$id.$network.chainId !== -1,
			)
			.filter(
				(r) => r.$id.symbol === symbol && r.$id.period === period,
			) as TransferEventRow[]
		upsertGraphFromEvents(symbol, period, rows)
		upsertBridgeTransferEvents(symbol, period, rows)
		upsertSwapTransferEvents(symbol, period, rows)
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
						symbol,
						period,
						blockNumber: -1,
						logIndex: -1,
					},
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
				const existingRow = transferEventsCollection.state.get(key)
				const row: TransferEventRow = {
					$id: {
						$network: { chainId: e.chainId },
						symbol,
						period,
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
			upsertGraphFromEvents(symbol, period, events)
			const rows = events.map((e) => ({
				$id: {
					$network: { chainId: e.chainId },
					symbol,
					period,
					blockNumber: e.blockNumber,
					logIndex: e.logIndex,
				},
				$source: DataSource.Voltaire,
				...e,
			})) as TransferEventRow[]
			upsertBridgeTransferEvents(symbol, period, rows)
			upsertSwapTransferEvents(symbol, period, rows)
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
