/**
 * Shared bridge settings state.
 * Single PersistedState instance used by both BridgeFlow and wallet context.
 */

import { PersistedState } from 'runed'
import { stringify, parse } from 'devalue'
import { ChainId } from '$/constants/networks.ts'

export enum BridgeRouteSort {
	Recommended = 'recommended',
	Output = 'output',
	Fees = 'fees',
	Speed = 'speed',
}

export type BridgeSettings = {
	slippage: number
	isTestnet: boolean
	sortBy: BridgeRouteSort
	fromChainId: number | null
	toChainId: number | null
	amount: bigint
	useCustomRecipient: boolean
	customRecipient: string
}

export const defaultBridgeSettings: BridgeSettings = {
	slippage: 0.005,
	isTestnet: false,
	sortBy: BridgeRouteSort.Recommended,
	fromChainId: ChainId.Ethereum,
	toChainId: ChainId.Optimism,
	amount: 1_000_000n,
	useCustomRecipient: false,
	customRecipient: '',
}

export const bridgeSettingsState = new PersistedState<BridgeSettings>(
	'bridge-settings',
	defaultBridgeSettings,
	{
		serializer: {
			serialize: stringify,
			deserialize: (v) => parse(v) as BridgeSettings,
		},
	},
)
