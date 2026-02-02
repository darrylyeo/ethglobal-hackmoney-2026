/**
 * Swap quotes collection. In-memory cache keyed by quote id (hash of params).
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import {
	normalizeSwapQuote,
	type SwapQuote,
	type SwapRoute,
} from './swap-quotes-normalize'

export type { SwapQuote, SwapRoute } from './swap-quotes-normalize'
export { normalizeSwapQuote }

export const swapQuotesCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'swap-quotes',
		getKey: (row: SwapQuote) => row.id,
	}),
)

export type FetchSwapQuoteParams = {
	chainId: number
	tokenIn: `0x${string}`
	tokenOut: `0x${string}`
	amountIn: bigint
	slippage: number
}

export const fetchSwapQuote = async (
	params: FetchSwapQuoteParams,
	getQuote: (p: FetchSwapQuoteParams) => Promise<SwapQuote>,
) => {
	const quote = await getQuote(params)
	const key = quote.id
	const row = normalizeSwapQuote(quote)
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
