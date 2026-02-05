/**
 * Transfer graphs collection: graph result per period from Voltaire (eth_getLogs).
 * Manually fetched data is normalized into this collection; UI reads from it.
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import type { CoinPageSymbol } from '$/constants/coins'
import {
	fetchTransfersGraphFromVoltaire,
	TIME_PERIODS,
	type TransferGraph,
	type TransfersGraphResult,
} from '$/api/transfers-indexer'

export type TransferGraphRow = {
	$id: { symbol: string; period: string }
	graph: TransferGraph
	period: string
	periods: typeof TIME_PERIODS
	$source: DataSource
	isLoading: boolean
	error: string | null
}

export const transferGraphsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'transfer-graphs',
		getKey: (row: TransferGraphRow) =>
			`${row.$id.symbol}:${row.$id.period}`,
	}),
)

const normalizeResult = (
	symbol: string,
	r: TransfersGraphResult,
): Omit<TransferGraphRow, 'isLoading' | 'error'> => ({
	$id: { symbol, period: r.period },
	graph: r.graph,
	period: r.period,
	periods: r.periods,
	$source: DataSource.Voltaire,
})

const RETRY_DELAY_MS = 1500
const MAX_ATTEMPTS = 3

const isTransientError = (message: string) =>
	/retry|internal error|timeout|unavailable|rate limit/i.test(message)

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
	let last: unknown
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		try {
			return await fn()
		} catch (e) {
			last = e
			const msg = e instanceof Error ? e.message : String(e)
			if (attempt === MAX_ATTEMPTS || !isTransientError(msg)) throw e
			await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
		}
	}
	throw last
}

export const fetchTransferGraph = async (
	symbol: CoinPageSymbol,
	period: string,
) => {
	const key = `${symbol}:${period}`
	const existing = transferGraphsCollection.state.get(key)

	if (existing) {
		transferGraphsCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.isLoading = true
			draft.error = null
		})
	} else {
		transferGraphsCollection.insert({
			$id: { symbol, period },
			graph: { nodes: [], edges: [] },
			period,
			periods: TIME_PERIODS,
			$source: DataSource.Voltaire,
			isLoading: true,
			error: null,
		})
	}

	try {
		const periodDef =
			TIME_PERIODS.find((p) => p.value === period) ?? TIME_PERIODS[3]
		const result =
			symbol === 'USDC'
				? await withRetry(() =>
						fetchTransfersGraphFromVoltaire(period),
					)
				: {
						graph: { nodes: [], edges: [] } as TransferGraph,
						period: periodDef.value,
						periods: TIME_PERIODS,
					}
		const normalized = normalizeResult(symbol, result)
		transferGraphsCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.graph = normalized.graph
			draft.period = normalized.period
			draft.periods = normalized.periods
			draft.isLoading = false
			draft.error = null
		})
		return result
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		transferGraphsCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.isLoading = false
			draft.error = message
		})
		throw e
	}
}

export const getTransferGraph = (symbol: string, period: string) =>
	transferGraphsCollection.state.get(`${symbol}:${period}`)
