/**
 * Per-provider spandex quotes cache. Normalizes getQuotes() results and flags
 * quote vs simulation mismatches.
 */

import { getQuotes, sortQuotesByPerformance } from '@spandex/core'
import type { ProviderKey, SimulatedQuote, SuccessfulSimulatedQuote } from '@spandex/core'
import type { ProtocolStrategy } from '$/constants/protocols.ts'
import { protocolStrategyQuoteMetric } from '$/constants/protocol-aggregator-quote-strategies.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import type {
	SpandexQuoteItem,
	SpandexQuoteRequestId,
} from '$/data/ProtocolAggregatorQuoteItem.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify } from 'devalue'
import { getSpandexQuoteForProvider, spandexConfig } from '$/api/protocol-aggregator.ts'
import type { FetchSwapQuoteParams } from '$/data/SwapQuote.ts'

const MISMATCH_THRESHOLD_BPS = 50

export const getRequestKeyForParams = (
	params: FetchSwapQuoteParams,
	swapperAccount: `0x${string}`,
): string =>
	stringify({
		chainId: params.chainId,
		inputToken: params.tokenIn,
		outputToken: params.tokenOut,
		amountIn: params.amountIn,
		slippageBps: Math.round(params.slippage * 10_000),
		swapperAccount,
	})

function mismatchBps(quoted: bigint, simulated: bigint): number | null {
	if (quoted === 0n) return null
	const diff =
		simulated >= quoted
			? Number(simulated - quoted)
			: -Number(quoted - simulated)
	return Math.round((Number(diff) / Number(quoted)) * 10_000)
}

function normalizedItem(
	requestId: SpandexQuoteRequestId,
	quote: SimulatedQuote,
	fetchedAt: number,
): SpandexQuoteItem {
	const reqKey = stringify(requestId)
	const provider = quote.provider
	const success = quote.success
	let quotedOutputAmount = 0n
	let simulatedOutputAmount: bigint | null = null
	let gasUsed: bigint | null = null
	let mismatchBpsVal: number | null = null
	let error: string | null = null

	let transactionRequest: SpandexQuoteItem['transactionRequest'] = undefined
	if (success) {
		const q = quote as SuccessfulSimulatedQuote
		quotedOutputAmount = q.outputAmount
		simulatedOutputAmount = q.simulation.outputAmount
		gasUsed = q.simulation.gasUsed ?? null
		const bps = mismatchBps(quotedOutputAmount, q.simulation.outputAmount)
		mismatchBpsVal = bps
		const tx = q.txData
		if (tx?.to && tx?.data) {
			transactionRequest = {
				to: tx.to as `0x${string}`,
				data: tx.data,
				value: tx.value != null ? String(tx.value) : '0',
				chainId: requestId.chainId,
				...(gasUsed != null ? { gasLimit: String(gasUsed) } : {}),
			}
		}
	} else {
		quotedOutputAmount = 'outputAmount' in quote ? quote.outputAmount : 0n
		error = quote.simulation.error?.message ?? null
	}

	const mismatchFlag =
		mismatchBpsVal !== null && Math.abs(mismatchBpsVal) > MISMATCH_THRESHOLD_BPS

	return {
		$id: { requestId: reqKey, provider },
		requestId,
		provider,
		success,
		quotedOutputAmount,
		simulatedOutputAmount,
		gasUsed,
		mismatchBps: mismatchBpsVal,
		mismatchFlag,
		error,
		fetchedAt,
		transactionRequest,
	}
}

export const spandexQuoteItemsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.SpandexQuoteItems,
		getKey: (item: WithSource<SpandexQuoteItem>) => stringify(item.$id),
	}),
)

export type FetchSpandexQuotesParams = SpandexQuoteRequestId

/** Fetch quote for a single provider, normalize, upsert to collection, return item or null. */
export const fetchSpandexQuoteForProvider = async (
	params: FetchSpandexQuotesParams,
	provider: ProviderKey,
): Promise<SpandexQuoteItem | null> => {
	const swap = {
		chainId: params.chainId,
		inputToken: params.inputToken,
		outputToken: params.outputToken,
		mode: 'exactIn' as const,
		inputAmount: params.amountIn,
		slippageBps: params.slippageBps,
		swapperAccount: params.swapperAccount,
	}
	const quote = await getSpandexQuoteForProvider(swap, provider)
	if (!quote) return null
	const fetchedAt = Date.now()
	const item: WithSource<SpandexQuoteItem> = {
		...normalizedItem(params, quote, fetchedAt),
		$source: DataSourceId.Spandex,
	}
	const key = stringify(item.$id)
	const existing = spandexQuoteItemsCollection.state.get(key)
	if (existing) {
		spandexQuoteItemsCollection.update(key, (draft) => {
			Object.assign(draft, item)
		})
	} else {
		spandexQuoteItemsCollection.insert(item)
	}
	return item
}

/** Fetch quotes from all providers, normalize, upsert to collection, return items. Optional strategy sorts successful quotes by that metric (best price, fastest, lowest gas). */
export const fetchSpandexQuotes = async (
	params: FetchSpandexQuotesParams,
	options?: { strategy?: ProtocolStrategy },
): Promise<SpandexQuoteItem[]> => {
	const swap = {
		chainId: params.chainId,
		inputToken: params.inputToken,
		outputToken: params.outputToken,
		mode: 'exactIn' as const,
		inputAmount: params.amountIn,
		slippageBps: params.slippageBps,
		swapperAccount: params.swapperAccount,
	}
	const quotes = await getQuotes({ config: spandexConfig, swap })
	const fetchedAt = Date.now()
	const reqKey = stringify(params)
	const successful = quotes.filter(
		(q): q is SuccessfulSimulatedQuote =>
			q.success && 'simulation' in q && (q as SuccessfulSimulatedQuote).simulation.success,
	)
	const failed = quotes.filter(
		(q) => !q.success || !(q as SuccessfulSimulatedQuote).simulation?.success,
	)
	const orderedQuotes: SimulatedQuote[] =
		options?.strategy && successful.length > 0
			? [
					...sortQuotesByPerformance({
						quotes: successful,
						...protocolStrategyQuoteMetric[options.strategy],
					}),
					...failed,
				]
			: [...successful, ...failed]
	const items: WithSource<SpandexQuoteItem>[] = orderedQuotes.map((q) => ({
		...normalizedItem(params, q, fetchedAt),
		$source: DataSourceId.Spandex,
	}))

	const existingKeys = new Set(
		[...spandexQuoteItemsCollection.state]
			.filter(
				([_, item]) =>
					item.$source === DataSourceId.Spandex &&
					stringify(item.requestId) === reqKey,
			)
			.map(([k]) => k),
	)
	for (const key of existingKeys) {
		if (!items.some((r) => stringify(r.$id) === key))
			spandexQuoteItemsCollection.delete(key)
	}
	for (const item of items) {
		const key = stringify(item.$id)
		const existing = spandexQuoteItemsCollection.state.get(key)
		if (existing) {
			spandexQuoteItemsCollection.update(key, (draft) => {
				Object.assign(draft, item)
			})
		} else {
			spandexQuoteItemsCollection.insert(item)
		}
	}
	return items
}

export type SwapQuoteRequestId = SpandexQuoteRequestId
export type ProtocolAggregatorQuoteRequestId = SpandexQuoteRequestId
export const swapQuoteItemsCollection = spandexQuoteItemsCollection
export const protocolAggregatorQuoteItemsCollection = spandexQuoteItemsCollection
export const fetchSwapQuotes = fetchSpandexQuotes
export const fetchSwapQuoteForProvider = fetchSpandexQuoteForProvider
export const fetchProtocolAggregatorQuotes = fetchSpandexQuotes
export const fetchProtocolAggregatorQuoteForProvider = fetchSpandexQuoteForProvider
