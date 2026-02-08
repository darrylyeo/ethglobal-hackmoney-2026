/**
 * Uniswap V4 position normalizer (no svelte-db dependency for Deno tests).
 */

import type { UniswapPosition } from '$/data/UniswapPosition.ts'

export const normalizeUniswapPosition = (
	entry: UniswapPosition,
): UniswapPosition => ({
	...entry,
	liquidity: BigInt(entry.liquidity),
	token0Owed: BigInt(entry.token0Owed),
	token1Owed: BigInt(entry.token1Owed),
})
