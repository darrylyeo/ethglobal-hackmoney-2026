/**
 * Swap quotes collection. In-memory cache keyed by quote id (hash of params).
 */

import {
	getSpandexQuote,
	spandexQuoteToSwapQuote,
	toSpandexSwapParams,
} from '$/api/protocol-aggregator.ts'
import { CollectionId } from '$/constants/collections.ts'
import { ProtocolStrategy } from '$/constants/protocols.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import type {
	FetchSwapQuoteParams,
	SwapQuote,
	SwapRoute,
} from '$/data/SwapQuote.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { normalizeSwapQuote } from './SwapQuotesNormalize.ts'

export const swapQuotesCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.SwapQuotes,
		getKey: (row: WithSource<SwapQuote>) => row.id,
	}),
)

export const fetchSwapQuote = async (
	params: FetchSwapQuoteParams,
	getQuote: (p: FetchSwapQuoteParams) => Promise<SwapQuote>,
) => {
	const quote = await getQuote(params)
	const key = quote.id
	const item = { ...normalizeSwapQuote(quote), $source: DataSourceId.Uniswap }
	const existing = swapQuotesCollection.state.get(key)
	if (existing) {
		swapQuotesCollection.update(key, (draft) => {
			Object.assign(draft, item)
		})
	} else {
		swapQuotesCollection.insert(item)
	}
	return quote
}

export const fetchSpandexSwapQuote = async (
	params: FetchSwapQuoteParams,
	swapperAccount: `0x${string}`,
	strategy: ProtocolStrategy = ProtocolStrategy.BestPrice,
): Promise<SwapQuote | null> => {
	const swap = toSpandexSwapParams(params, swapperAccount)
	const quote = await getSpandexQuote(swap, strategy)
	if (!quote) return null
	const normalized = spandexQuoteToSwapQuote(quote, params)
	const item = {
		...normalizeSwapQuote(normalized),
		$source: DataSourceId.Spandex,
	}
	const key = normalized.id
	const existing = swapQuotesCollection.state.get(key)
	if (existing) {
		swapQuotesCollection.update(key, (draft) => {
			Object.assign(draft, item)
		})
	} else {
		swapQuotesCollection.insert(item)
	}
	return normalized
}
