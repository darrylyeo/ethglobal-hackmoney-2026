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

export const networkFilterGroups = [
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
] as const satisfies readonly NetworkFilterGroup[]

import { CoinId } from '$/constants/coins.ts'

export type CoinIdGroup = {
	id: string
	label: string
	coinIds: readonly CoinId[]
}

export const coinIdGroups = [
	{ id: 'stablecoins', label: 'Stablecoins', coinIds: [CoinId.USDC] },
	{ id: 'native', label: 'Native', coinIds: [CoinId.ETH] },
] as const satisfies readonly CoinIdGroup[]
