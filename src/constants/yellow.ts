/**
 * Yellow Network / Nitrolite: Custody Contract and Clearnode endpoints.
 * Contract addresses: populate from Yellow docs when deploying.
 */

import { ChainId } from '$/constants/networks'

export const CUSTODY_CONTRACT_ADDRESS: Partial<Record<number, `0x${string}`>> = {
	[ChainId.Ethereum]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
	[ChainId.Optimism]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
	[ChainId.Arbitrum]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
	[ChainId.Base]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
}

export const CLEARNODE_WS_URL: Partial<Record<number, string>> = {
	[ChainId.Ethereum]: 'wss://clearnode.yellow.org/ethereum',
	[ChainId.Optimism]: 'wss://clearnode.yellow.org/optimism',
	[ChainId.Arbitrum]: 'wss://clearnode.yellow.org/arbitrum',
	[ChainId.Base]: 'wss://clearnode.yellow.org/base',
}

export const CHALLENGE_PERIOD = 24 * 60 * 60

export const MIN_CHANNEL_DEPOSIT = 10n * 10n ** 6n
