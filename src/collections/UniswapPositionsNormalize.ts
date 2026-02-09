/**
 * Uniswap V4 position normalizer (no svelte-db dependency for Deno tests).
 */

import type { UniswapPosition } from '$/data/UniswapPosition.ts'

const toBigInt = (v: unknown): bigint => {
	if (v === undefined || v === null) return 0n
	if (typeof v === 'bigint') return v
	const s = String(v)
	if (
		s === '' ||
		s === '0x' ||
		s === '0xundefined' ||
		!/^(0x)?[0-9a-fA-F]+$/.test(s)
	)
		return 0n
	return BigInt(s.startsWith('0x') ? s : `0x${s}`)
}

export const normalizeUniswapPosition = (
	entry: UniswapPosition,
): UniswapPosition => ({
	...entry,
	liquidity: toBigInt(entry.liquidity),
	token0Owed: toBigInt(entry.token0Owed),
	token1Owed: toBigInt(entry.token1Owed),
})
