/**
 * Uniswap V4 contract addresses and fee tiers.
 * PoolManager and Universal Router addresses per chain (placeholder until V4 deployment).
 */

import { ChainId } from '$/constants/networks'

export const POOL_MANAGER_ADDRESS: Partial<Record<number, `0x${string}`>> = {
	[ChainId.Ethereum]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
	[ChainId.Optimism]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
	[ChainId.Arbitrum]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
	[ChainId.Base]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
}

export const UNIVERSAL_ROUTER_ADDRESS: Partial<Record<number, `0x${string}`>> = {
	[ChainId.Ethereum]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
	[ChainId.Optimism]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
	[ChainId.Arbitrum]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
	[ChainId.Base]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
}

export const FEE_TIERS = [100, 500, 3000, 10000] as const

export const TICK_SPACINGS: Record<number, number> = {
	100: 1,
	500: 10,
	3000: 60,
	10000: 200,
}
