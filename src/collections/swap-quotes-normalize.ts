/**
 * Swap quote normalizer (no svelte-db dependency for Deno tests).
 */

export type SwapRoute = {
	poolId: string
	tokenIn: `0x${string}`
	tokenOut: `0x${string}`
	fee: number
}

export type SwapQuote = {
	id: string
	chainId: number
	tokenIn: `0x${string}`
	tokenOut: `0x${string}`
	amountIn: bigint
	amountOut: bigint
	priceImpact: number
	route: SwapRoute[]
	gasEstimate: bigint
	timestamp: number
}

export const normalizeSwapQuote = (entry: SwapQuote): SwapQuote => ({
	...entry,
	amountIn: BigInt(entry.amountIn),
	amountOut: BigInt(entry.amountOut),
	route: entry.route.map((r) => ({ ...r })),
	gasEstimate: BigInt(entry.gasEstimate),
})
