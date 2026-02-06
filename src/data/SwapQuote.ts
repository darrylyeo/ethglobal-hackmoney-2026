export type SwapRoute = {
	poolId: string
	tokenIn: `0x${string}`
	tokenOut: `0x${string}`
	fee: number,
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
	timestamp: number,
}

export type FetchSwapQuoteParams = {
	chainId: number
	tokenIn: `0x${string}`
	tokenOut: `0x${string}`
	amountIn: bigint
	slippage: number,
}

