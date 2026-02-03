/**
 * Swap quotes collection. In-memory cache keyed by quote id (hash of params).
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import type {
	FetchSwapQuoteParams,
	SwapQuote,
	SwapRoute,
} from '$/data/SwapQuote'
import { normalizeSwapQuote } from './swap-quotes-normalize'

export const swapQuotesCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'swap-quotes',
		getKey: (row: SwapQuoteRow) => row.id,
	}),
)

export type SwapQuoteRow = SwapQuote & { $source: DataSource }

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
