export type UniswapPool = {
	id: string
	chainId: number
	token0: `0x${string}`
	token1: `0x${string}`
	fee: number
	tickSpacing: number
	hooks: `0x${string}`
	sqrtPriceX96: bigint
	liquidity: bigint
	tick: number
}

