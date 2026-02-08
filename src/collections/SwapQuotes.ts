/**
 * Swap quotes collection. In-memory cache keyed by quote id (hash of params).
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
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

export type SwapQuoteRow = SwapQuote & { $source: DataSource }

export const swapQuotesCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.SwapQuotes,
		getKey: (row: SwapQuoteRow) => row.id,
	}),
)

export const fetchSwapQuote = async (
	params: FetchSwapQuoteParams,
	getQuote: (p: FetchSwapQuoteParams) => Promise<SwapQuote>,
) => {
	const quote = await getQuote(params)
	const key = quote.id
	const row = { ...normalizeSwapQuote(quote), $source: DataSource.Uniswap }
	const existing = swapQuotesCollection.state.get(key)
	if (existing) {
		swapQuotesCollection.update(key, (draft) => {
			Object.assign(draft, row)
		})
	} else {
		swapQuotesCollection.insert(row)
	}
	return quote
}
