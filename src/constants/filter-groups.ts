/**
 * Grouped presets for network and coin filters (e.g. Combobox with group headings).
 * Used by NetworksInput and CoinsInput for protocol / token-list groupings.
 */

import { cctpDomainByChainId } from '$/constants/cctp.ts'
import type { Network } from '$/constants/networks.ts'
import { NetworkType, networks } from '$/constants/networks.ts'

export type NetworkFilterGroup = {
	id: string
	label: string
	networks: readonly Network[]
}

const cctpChainIds = new Set(Object.keys(cctpDomainByChainId).map(Number))

export const networkFilterGroups: readonly NetworkFilterGroup[] = [
	{
		id: 'cctp',
		label: 'Circle CCTP',
		networks: networks.filter((n) => cctpChainIds.has(n.chainId)),
	},
	{
		id: 'mainnet',
		label: 'Mainnet',
		networks: networks.filter(
			(n) => n.type === NetworkType.Mainnet && !cctpChainIds.has(n.chainId),
		),
	},
	{
		id: 'testnet',
		label: 'Testnet',
		networks: networks.filter(
			(n) => n.type === NetworkType.Testnet && !cctpChainIds.has(n.chainId),
		),
	},
]

export type CoinSymbolGroup = {
	id: string
	label: string
	symbols: readonly string[]
}

export const coinSymbolGroups: readonly CoinSymbolGroup[] = [
	{ id: 'stablecoins', label: 'Stablecoins', symbols: ['USDC'] },
	{ id: 'native', label: 'Native', symbols: ['ETH'] },
]
