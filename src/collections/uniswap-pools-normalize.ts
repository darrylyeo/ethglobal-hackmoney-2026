/**
 * Uniswap V4 pool normalizer (no svelte-db dependency for Deno tests).
 */

import type { UniswapPool } from '$/data/UniswapPool'

export const normalizeUniswapPool = (entry: UniswapPool): UniswapPool => ({
	...entry,
	sqrtPriceX96: BigInt(entry.sqrtPriceX96),
	liquidity: BigInt(entry.liquidity),
})

