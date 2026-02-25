/**
 * Uniswap V4 position normalizer (no svelte-db dependency for Deno tests).
 */

import type { UniswapPosition, UniswapPosition$Id } from '$/data/UniswapPosition.ts'
import { normalizeAddress } from '$/lib/address.ts'

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

type UniswapPositionInput = (Partial<UniswapPosition> & Pick<UniswapPosition, 'poolId' | 'owner'>) &
	({ $id: UniswapPosition$Id } | { id: string; chainId: number })

export const normalizeUniswapPosition = (entry: UniswapPositionInput): UniswapPosition => {
	const chainId = '$id' in entry ? entry.$id.chainId : entry.chainId
	const id = '$id' in entry ? entry.$id.id : entry.id
	return {
		$id: { chainId, id },
		poolId: entry.poolId ?? '',
	owner: (normalizeAddress(entry.owner) ?? entry.owner) as `0x${string}`,
	tickLower: entry.tickLower ?? 0,
	tickUpper: entry.tickUpper ?? 0,
	liquidity: toBigInt(entry.liquidity),
	token0Owed: toBigInt(entry.token0Owed),
	token1Owed: toBigInt(entry.token1Owed),
	...(entry.tokenId != null && { tokenId: entry.tokenId }),
	...(entry.origin != null && {
		origin: (normalizeAddress(entry.origin) ?? entry.origin) as `0x${string}`,
	}),
	...(entry.createdAtTimestamp != null && { createdAtTimestamp: entry.createdAtTimestamp }),
	}
}
