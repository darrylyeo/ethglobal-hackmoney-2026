export type UniswapPool$Id = { chainId: number; id: string }

export type UniswapPool = {
	$id: UniswapPool$Id
	token0: `0x${string}`
	token1: `0x${string}`
	fee: number
	tickSpacing: number
	hooks: `0x${string}`
	sqrtPriceX96: bigint
	liquidity: bigint
	tick: number
	token0Symbol?: string
	token1Symbol?: string
	token0Decimals?: number
	token1Decimals?: number
	volumeUSD?: string | number
	totalValueLockedUSD?: string | number
}

