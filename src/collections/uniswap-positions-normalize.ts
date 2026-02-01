/**
 * Uniswap V4 position normalizer (no svelte-db dependency for Deno tests).
 */

export type UniswapPosition = {
	id: string
	chainId: number
	poolId: string
	owner: `0x${string}`
	tickLower: number
	tickUpper: number
	liquidity: bigint
	token0Owed: bigint
	token1Owed: bigint
}

export const normalizeUniswapPosition = (entry: UniswapPosition): UniswapPosition => ({
	...entry,
	liquidity: BigInt(entry.liquidity),
	token0Owed: BigInt(entry.token0Owed),
	token1Owed: BigInt(entry.token1Owed),
})
