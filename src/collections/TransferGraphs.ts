/**
 * Transfer graphs: derived from transfer events in TanStack DB (cache).
 * Populated by TransferEvents after fetch; no direct RPC.
 */

import {
	buildGraph,
	type TimePeriodEntry,
	type TransferGraph,
	TIME_PERIODS,
} from '$/api/transfers-indexer.ts'
import type { NormalizedTransferEvent } from '$/api/transfers-logs.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type TransferGraphRow = {
	$id: { symbol: string; period: string }
	graph: TransferGraph
	period: string
	periods: readonly TimePeriodEntry[]
	$source: DataSource
	isLoading: boolean
	error: string | null
}

export const transferGraphsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.TransferGraphs,
		getKey: (row: TransferGraphRow) => `${row.$id.symbol}:${row.$id.period}`,
	}),
)

export function upsertGraphFromEvents(
	symbol: string,
	period: string,
	events: NormalizedTransferEvent[],
): void {
	const transfers = events.map((e) => ({
		fromAddress: e.fromAddress,
		toAddress: e.toAddress,
		amount: e.amount,
		timestamp: e.timestamp,
		chainId: e.chainId,
	}))
	const graph = buildGraph(transfers)
	const key = `${symbol}:${period}`
	const existing = transferGraphsCollection.state.get(key)
	const row: Omit<TransferGraphRow, 'isLoading' | 'error'> & {
		isLoading: boolean
		error: string | null
	} = {
		$id: { symbol, period },
		graph,
		period,
		periods: TIME_PERIODS,
		$source: DataSource.Voltaire,
		isLoading: false,
		error: null,
	}
	if (existing)
		transferGraphsCollection.update(key, (draft) => {
			draft.graph = row.graph
			draft.period = row.period
			draft.periods = [...row.periods]
			draft.isLoading = false
			draft.error = null
		})
	else transferGraphsCollection.insert(row)
}

export const getTransferGraph = (symbol: string, period: string) =>
	transferGraphsCollection.state.get(`${symbol}:${period}`)
