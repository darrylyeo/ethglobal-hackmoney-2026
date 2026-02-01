/**
 * Uniswap V4 pool normalizer (no svelte-db dependency for Deno tests).
 */

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

export const normalizeUniswapPool = (entry: UniswapPool): UniswapPool => ({
	...entry,
	sqrtPriceX96: BigInt(entry.sqrtPriceX96),
	liquidity: BigInt(entry.liquidity),
})
