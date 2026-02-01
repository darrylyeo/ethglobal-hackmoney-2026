/**
 * Shared swap settings state.
 */

import { PersistedState } from 'runed'
import { stringify, parse } from 'devalue'
import { ChainId } from '$/constants/networks'

export type SwapSettings = {
	chainId: number
	tokenIn: `0x${string}`
	tokenOut: `0x${string}`
	amount: bigint
	slippage: number
}

export const defaultSwapSettings: SwapSettings = {
	chainId: ChainId.Ethereum,
	tokenIn: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
	tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
	amount: 0n,
	slippage: 0.005,
}

export const swapSettingsState = new PersistedState<SwapSettings>(
	'swap-settings',
	defaultSwapSettings,
	{ serializer: { serialize: stringify, deserialize: (v) => parse(v) as SwapSettings } },
)
