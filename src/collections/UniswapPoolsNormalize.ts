/**
 * Uniswap V4 pool normalizer (no svelte-db dependency for Deno tests).
 */

import type { UniswapPool, UniswapPool$Id } from '$/data/UniswapPool.ts'

type UniswapPoolInput = (Partial<UniswapPool> & Pick<UniswapPool, 'token0' | 'token1' | 'fee' | 'tickSpacing' | 'hooks'>) &
	({ $id: UniswapPool$Id } | { id: string; chainId: number })

export const normalizeUniswapPool = (entry: UniswapPoolInput): UniswapPool => {
	const chainId = '$id' in entry ? entry.$id.chainId : entry.chainId
	const id = '$id' in entry ? entry.$id.id : entry.id
	return {
		$id: { chainId, id },
		token0: entry.token0,
	token1: entry.token1,
	fee: entry.fee,
	tickSpacing: entry.tickSpacing,
	hooks: entry.hooks,
	sqrtPriceX96: BigInt(entry.sqrtPriceX96 ?? 0),
	liquidity: BigInt(entry.liquidity ?? 0),
	tick: entry.tick ?? 0,
	token0Symbol: entry.token0Symbol,
	token1Symbol: entry.token1Symbol,
	token0Decimals: entry.token0Decimals,
	token1Decimals: entry.token1Decimals,
	volumeUSD: entry.volumeUSD,
	totalValueLockedUSD: entry.totalValueLockedUSD,
	}
}

