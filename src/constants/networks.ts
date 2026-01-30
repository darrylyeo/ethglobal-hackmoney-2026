/**
 * EVM networks with native USDC per Circle; LI.FI supports these for bridging.
 * Chain IDs and names aligned with LI.FI / Circle USDC coverage.
 */

export enum Network {
	Ethereum = 1,
	Optimism = 10,
	Polygon = 137,
	Arbitrum = 42161,
	Avalanche = 43114,
	Celo = 42220,
	Base = 8453,
	Linea = 59144,
	ZkSyncEra = 324,
}

export const networks = {
	[Network.Ethereum]: { name: 'Ethereum' },
	[Network.Optimism]: { name: 'OP Mainnet' },
	[Network.Polygon]: { name: 'Polygon PoS' },
	[Network.Arbitrum]: { name: 'Arbitrum One' },
	[Network.Avalanche]: { name: 'Avalanche C-Chain' },
	[Network.Celo]: { name: 'Celo' },
	[Network.Base]: { name: 'Base' },
	[Network.Linea]: { name: 'Linea' },
	[Network.ZkSyncEra]: { name: 'ZKsync Era' },
} as const satisfies Record<Network, { name: string }>
