/**
 * Swap quote normalizer (no svelte-db dependency for Deno tests).
 */

import type { SwapQuote } from '$/data/SwapQuote'

export const normalizeSwapQuote = (entry: SwapQuote): SwapQuote => ({
	...entry,
	amountIn: BigInt(entry.amountIn),
	amountOut: BigInt(entry.amountOut),
	route: entry.route.map((r) => ({ ...r })),
	gasEstimate: BigInt(entry.gasEstimate),
})

