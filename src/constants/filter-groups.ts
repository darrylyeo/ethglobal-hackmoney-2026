/**
 * Grouped presets for network and coin filters (e.g. Combobox with group headings).
 * Used by NetworksInput and CoinsInput for protocol / token-list groupings.
 * Structure follows spec 045.
 */

import { CoinId } from '$/constants/coins.ts'
import { cctpDomainByChainId } from '$/constants/cctp.ts'
import type { Network } from '$/constants/networks.ts'
import { NetworkType, networks } from '$/constants/networks.ts'

export enum NetworkFilterGroupId {
	Cctp = 'Cctp',
	Mainnet = 'Mainnet',
	Testnet = 'Testnet',
}

export type NetworkFilterGroup = {
	id: NetworkFilterGroupId
	label: string
	networks: readonly Network[]
}

const cctpChainIds = new Set(Object.keys(cctpDomainByChainId).map(Number))

export const networkFilterGroups = [
	{
		id: NetworkFilterGroupId.Cctp,
		label: 'Circle CCTP',
		networks: networks.filter((n) => cctpChainIds.has(n.chainId)),
	},
	{
		id: NetworkFilterGroupId.Mainnet,
		label: 'Mainnet',
		networks: networks.filter(
			(n) => n.type === NetworkType.Mainnet && !cctpChainIds.has(n.chainId),
		),
	},
	{
		id: NetworkFilterGroupId.Testnet,
		label: 'Testnet',
		networks: networks.filter(
			(n) => n.type === NetworkType.Testnet && !cctpChainIds.has(n.chainId),
		),
	},
] as const satisfies readonly NetworkFilterGroup[]

export const networkFilterGroupsById = Object.fromEntries(
	networkFilterGroups.map((g) => [g.id, g]),
) as Record<NetworkFilterGroupId, NetworkFilterGroup>

export enum CoinIdGroupId {
	Stablecoins = 'Stablecoins',
	Native = 'Native',
}

export type CoinIdGroup = {
	id: CoinIdGroupId
	label: string
	coinIds: readonly CoinId[]
}

export const coinIdGroups = [
	{ id: CoinIdGroupId.Stablecoins, label: 'Stablecoins', coinIds: [CoinId.USDC] },
	{ id: CoinIdGroupId.Native, label: 'Native', coinIds: [CoinId.ETH] },
] as const satisfies readonly CoinIdGroup[]

export const coinIdGroupsById = Object.fromEntries(
	coinIdGroups.map((g) => [g.id, g]),
) as Record<CoinIdGroupId, CoinIdGroup>
