/**
 * EVM networks with native USDC per Circle; LI.FI supports these for bridging.
 * Chain IDs and names aligned with LI.FI / Circle USDC coverage.
 */

export type Network = {
	id: ChainId
	name: string
}

export enum ChainId {
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

export const networks = [
	{
		id: ChainId.Ethereum,
		name: 'Ethereum',
	},
	{
		id: ChainId.Optimism,
		name: 'OP Mainnet',
	},
	{
		id: ChainId.Polygon,
		name: 'Polygon PoS',
	},
	{
		id: ChainId.Arbitrum,
		name: 'Arbitrum One',
	},
	{
		id: ChainId.Avalanche,
		name: 'Avalanche C-Chain',
	},
	{
		id: ChainId.Celo,
		name: 'Celo',
	},
	{
		id: ChainId.Base,
		name: 'Base',
	},
	{
		id: ChainId.Linea,
		name: 'Linea',
	},
	{
		id: ChainId.ZkSyncEra,
		name: 'ZKsync Era',
	},
] as const satisfies Network[]

export const networksByChainId = Object.fromEntries(
	networks.map((n) => [n.id, n]),
)
