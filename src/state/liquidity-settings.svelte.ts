/**
 * Shared liquidity settings state.
 */

import { PersistedState } from 'runed'
import { stringify, parse } from 'devalue'
import { ChainId } from '$/constants/networks.ts'

export type LiquiditySettings = {
	chainId: number
	token0: `0x${string}`
	token1: `0x${string}`
	fee: number
	tickLower: number
	tickUpper: number
	amount0: bigint
	amount1: bigint,
}

export const defaultLiquiditySettings: LiquiditySettings = {
	chainId: ChainId.Ethereum,
	token0: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
	token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
	fee: 3000,
	tickLower: -887220,
	tickUpper: 887220,
	amount0: 0n,
	amount1: 0n,
}

export const liquiditySettingsState = new PersistedState<LiquiditySettings>(
	'liquidity-settings',
	defaultLiquiditySettings,
	{
		serializer: {
			serialize: stringify,
			deserialize: (v) => parse(v) as LiquiditySettings,
		},
	},
)
