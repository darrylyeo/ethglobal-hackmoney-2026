/**
 * EVM networks with native USDC per Circle (mainnets and testnets).
 * Chain IDs and names from Circle USDC contract addresses and CCTP docs.
 */

export enum NetworkType {
	Mainnet = 'Mainnet',
	Testnet = 'Testnet',
}

export type Network = {
	id: ChainId
	name: string
	type: NetworkType
}

export enum ChainId {
	Ethereum = 1,
	Optimism = 10,
	XDC = 50,
	XDCApothem = 51,
	Unichain = 130,
	UnichainSepolia = 1301,
	Polygon = 137,
	PolygonAmoy = 80002,
	Monad = 143,
	MonadTestnet = 10143,
	Sonic = 146,
	SonicTestnet = 14601,
	ZkSyncEraSepolia = 300,
	ZkSyncEra = 324,
	WorldChain = 480,
	WorldChainSepolia = 4801,
	HyperEVMTestnet = 998,
	HyperEVM = 999,
	SeiTestnet = 1328,
	Sei = 1329,
	Arbitrum = 42161,
	ArbitrumSepolia = 421614,
	Celo = 42220,
	AvalancheFuji = 43113,
	Avalanche = 43114,
	Base = 8453,
	BaseSepolia = 84532,
	Ink = 57073,
	LineaSepolia = 59141,
	Linea = 59144,
	InkTestnet = 763373,
	Codex = 81224,
	CodexTestnet = 812242,
	Plume = 98866,
	PlumeTestnet = 98867,
	EthereumSepolia = 11155111,
	OPSepolia = 11155420,
	CeloSepolia = 11142220,
	ArcTestnet = 5042002,
}

export const networks = [
	{
		id: ChainId.Ethereum,
		name: 'Ethereum',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.Optimism,
		name: 'OP Mainnet',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.XDC,
		name: 'XDC',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.XDCApothem,
		name: 'XDC Apothem',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.Unichain,
		name: 'Unichain',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.UnichainSepolia,
		name: 'Unichain Sepolia',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.Polygon,
		name: 'Polygon PoS',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.PolygonAmoy,
		name: 'Polygon PoS Amoy',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.Monad,
		name: 'Monad',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.MonadTestnet,
		name: 'Monad Testnet',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.Sonic,
		name: 'Sonic',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.SonicTestnet,
		name: 'Sonic Testnet',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.ZkSyncEraSepolia,
		name: 'ZKsync Era Sepolia',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.ZkSyncEra,
		name: 'ZKsync Era',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.WorldChain,
		name: 'World Chain',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.WorldChainSepolia,
		name: 'World Chain Sepolia',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.HyperEVMTestnet,
		name: 'HyperEVM Testnet',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.HyperEVM,
		name: 'HyperEVM',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.SeiTestnet,
		name: 'Sei Testnet',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.Sei,
		name: 'Sei',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.Arbitrum,
		name: 'Arbitrum One',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.ArbitrumSepolia,
		name: 'Arbitrum Sepolia',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.Celo,
		name: 'Celo',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.AvalancheFuji,
		name: 'Avalanche Fuji',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.Avalanche,
		name: 'Avalanche C-Chain',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.Base,
		name: 'Base',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.BaseSepolia,
		name: 'Base Sepolia',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.Ink,
		name: 'Ink',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.LineaSepolia,
		name: 'Linea Sepolia',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.Linea,
		name: 'Linea',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.InkTestnet,
		name: 'Ink Testnet',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.Codex,
		name: 'Codex',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.CodexTestnet,
		name: 'Codex Testnet',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.Plume,
		name: 'Plume',
		type: NetworkType.Mainnet,
	},
	{
		id: ChainId.PlumeTestnet,
		name: 'Plume Testnet',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.CeloSepolia,
		name: 'Celo Sepolia',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.EthereumSepolia,
		name: 'Ethereum Sepolia',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.OPSepolia,
		name: 'OP Sepolia',
		type: NetworkType.Testnet,
	},
	{
		id: ChainId.ArcTestnet,
		name: 'Arc Testnet',
		type: NetworkType.Testnet,
	},
] as const satisfies readonly Network[]

export const networksByChainId = Object.fromEntries(
	networks.map((n) => [n.id, n]),
)
