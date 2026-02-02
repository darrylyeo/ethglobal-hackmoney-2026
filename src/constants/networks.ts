/**
 * EVM networks with native USDC per Circle (mainnets and testnets).
 * Chain IDs and names from Circle USDC contract addresses and CCTP docs.
 */

export enum NetworkType {
	Mainnet = 'Mainnet',
	Testnet = 'Testnet',
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

export type Network = {
	id: ChainId
	name: string
	type: NetworkType
}

export enum ServiceProvider {
	Chain = 'Chain',
	LlamaRPC = 'LlamaRPC',
	Alchemy = 'Alchemy',
	Public = 'Public',
}

export enum TransportType {
	Http = 'Http',
	WebSocket = 'WebSocket',
}

export type NetworkCurrency = {
	name: string
	symbol: string
}

export type RpcEndpoint = {
	chainId: ChainId
	url: string
	serviceProvider: ServiceProvider
	transportType: TransportType
}

export type Explorer = {
	chainId: ChainId
	url: string
}

export type NetworkConfig = {
	chainId: ChainId
	name: string
	type: NetworkType
	nativeCurrency: NetworkCurrency
	explorerUrl?: string
	rpcEndpoints: readonly RpcEndpoint[]
}

export const networkConfigs: readonly NetworkConfig[] = [
	{
		chainId: ChainId.Ethereum,
		name: 'Ethereum',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://etherscan.io',
		rpcEndpoints: [
			{
				chainId: ChainId.Ethereum,
				url: 'https://mainnet.rpc.buidlguidl.com',
				serviceProvider: ServiceProvider.Public,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Optimism,
		name: 'OP Mainnet',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://optimistic.etherscan.io',
		rpcEndpoints: [
			{
				chainId: ChainId.Optimism,
				url: 'https://mainnet.optimism.io',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.XDC,
		name: 'XDC',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'XDC', symbol: 'XDC' },
		explorerUrl: 'https://xdc.blocksscan.io',
		rpcEndpoints: [
			{
				chainId: ChainId.XDC,
				url: 'https://erpc.xinfin.network',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.XDCApothem,
		name: 'XDC Apothem',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'XDC', symbol: 'XDC' },
		explorerUrl: 'https://apothem.blocksscan.io',
		rpcEndpoints: [
			{
				chainId: ChainId.XDCApothem,
				url: 'https://rpc.apothem.network',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Unichain,
		name: 'Unichain',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Unichain', symbol: 'UNI' },
		explorerUrl: 'https://unichain.blockscout.com',
		rpcEndpoints: [
			{
				chainId: ChainId.Unichain,
				url: 'https://unichain-rpc.publicnode.com',
				serviceProvider: ServiceProvider.Public,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.UnichainSepolia,
		name: 'Unichain Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Unichain', symbol: 'UNI' },
		explorerUrl: 'https://sepolia.unichain.blockscout.com',
		rpcEndpoints: [
			{
				chainId: ChainId.UnichainSepolia,
				url: 'https://sepolia.unichain.org',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Polygon,
		name: 'Polygon PoS',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'MATIC', symbol: 'MATIC' },
		explorerUrl: 'https://polygonscan.com',
		rpcEndpoints: [
			{
				chainId: ChainId.Polygon,
				url: 'https://polygon-rpc.com',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.PolygonAmoy,
		name: 'Polygon PoS Amoy',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'MATIC', symbol: 'MATIC' },
		explorerUrl: 'https://amoy.polygonscan.com',
		rpcEndpoints: [
			{
				chainId: ChainId.PolygonAmoy,
				url: 'https://rpc-amoy.polygon.technology',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Monad,
		name: 'Monad',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://explorer.monad.xyz',
		rpcEndpoints: [
			{
				chainId: ChainId.Monad,
				url: 'https://rpc.monad.xyz',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.MonadTestnet,
		name: 'Monad Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://testnet-explorer.monad.xyz',
		rpcEndpoints: [
			{
				chainId: ChainId.MonadTestnet,
				url: 'https://testnet-rpc.monad.xyz',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Sonic,
		name: 'Sonic',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'S', symbol: 'S' },
		explorerUrl: 'https://sonicscan.org',
		rpcEndpoints: [
			{
				chainId: ChainId.Sonic,
				url: 'https://rpc.soniclabs.com',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.SonicTestnet,
		name: 'Sonic Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'S', symbol: 'S' },
		explorerUrl: 'https://testnet.sonicscan.org',
		rpcEndpoints: [
			{
				chainId: ChainId.SonicTestnet,
				url: 'https://rpc.testnet.soniclabs.com',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.ZkSyncEraSepolia,
		name: 'ZKsync Era Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia-era.zksync.network',
		rpcEndpoints: [
			{
				chainId: ChainId.ZkSyncEraSepolia,
				url: 'https://sepolia.era.zksync.dev',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.ZkSyncEra,
		name: 'ZKsync Era',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://era.zksync.network',
		rpcEndpoints: [
			{
				chainId: ChainId.ZkSyncEra,
				url: 'https://mainnet.era.zksync.io',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.WorldChain,
		name: 'World Chain',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://worldscan.org',
		rpcEndpoints: [
			{
				chainId: ChainId.WorldChain,
				url: 'https://worldchain-mainnet.g.alchemy.com/public',
				serviceProvider: ServiceProvider.Alchemy,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.WorldChainSepolia,
		name: 'World Chain Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia.worldscan.org',
		rpcEndpoints: [
			{
				chainId: ChainId.WorldChainSepolia,
				url: 'https://worldchain-sepolia.g.alchemy.com/public',
				serviceProvider: ServiceProvider.Alchemy,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.HyperEVMTestnet,
		name: 'HyperEVM Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://testnet.hyper.evm.cc',
		rpcEndpoints: [
			{
				chainId: ChainId.HyperEVMTestnet,
				url: 'https://hyperliquid-testnet.drpc.org',
				serviceProvider: ServiceProvider.Public,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.HyperEVM,
		name: 'HyperEVM',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://hyper.evm.cc',
		rpcEndpoints: [
			{
				chainId: ChainId.HyperEVM,
				url: 'https://hyperliquid.drpc.org',
				serviceProvider: ServiceProvider.Public,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.SeiTestnet,
		name: 'Sei Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'SEI', symbol: 'SEI' },
		explorerUrl: 'https://testnet.seitrace.com',
		rpcEndpoints: [
			{
				chainId: ChainId.SeiTestnet,
				url: 'https://evm-rpc-testnet.sei-apis.com',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Sei,
		name: 'Sei',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'SEI', symbol: 'SEI' },
		explorerUrl: 'https://seitrace.com',
		rpcEndpoints: [
			{
				chainId: ChainId.Sei,
				url: 'https://evm-rpc.sei-apis.com',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Arbitrum,
		name: 'Arbitrum One',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://arbiscan.io',
		rpcEndpoints: [
			{
				chainId: ChainId.Arbitrum,
				url: 'https://arb1.arbitrum.io/rpc',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.ArbitrumSepolia,
		name: 'Arbitrum Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia.arbiscan.io',
		rpcEndpoints: [
			{
				chainId: ChainId.ArbitrumSepolia,
				url: 'https://sepolia-rollup.arbitrum.io/rpc',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Celo,
		name: 'Celo',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'CELO', symbol: 'CELO' },
		explorerUrl: 'https://celoscan.io',
		rpcEndpoints: [
			{
				chainId: ChainId.Celo,
				url: 'https://forno.celo.org',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.AvalancheFuji,
		name: 'Avalanche Fuji',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'AVAX', symbol: 'AVAX' },
		explorerUrl: 'https://testnet.snowtrace.io',
		rpcEndpoints: [
			{
				chainId: ChainId.AvalancheFuji,
				url: 'https://api.avax-test.network/ext/bc/C/rpc',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Avalanche,
		name: 'Avalanche C-Chain',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'AVAX', symbol: 'AVAX' },
		explorerUrl: 'https://snowtrace.io',
		rpcEndpoints: [
			{
				chainId: ChainId.Avalanche,
				url: 'https://api.avax.network/ext/bc/C/rpc',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Base,
		name: 'Base',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://basescan.org',
		rpcEndpoints: [
			{
				chainId: ChainId.Base,
				url: 'https://mainnet.base.org',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.BaseSepolia,
		name: 'Base Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia.basescan.org',
		rpcEndpoints: [
			{
				chainId: ChainId.BaseSepolia,
				url: 'https://sepolia.base.org',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Ink,
		name: 'Ink',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://explorer.inkonchain.com',
		rpcEndpoints: [
			{
				chainId: ChainId.Ink,
				url: 'https://rpc-gel.inkonchain.com',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.LineaSepolia,
		name: 'Linea Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia.lineascan.build',
		rpcEndpoints: [
			{
				chainId: ChainId.LineaSepolia,
				url: 'https://rpc.sepolia.linea.build',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Linea,
		name: 'Linea',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://lineascan.build',
		rpcEndpoints: [
			{
				chainId: ChainId.Linea,
				url: 'https://rpc.linea.build',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.InkTestnet,
		name: 'Ink Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://testnet.explorer.inkonchain.com',
		rpcEndpoints: [
			{
				chainId: ChainId.InkTestnet,
				url: 'https://rpc-gel-sepolia.inkonchain.com',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Codex,
		name: 'Codex',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://explorer.codexchain.io',
		rpcEndpoints: [
			{
				chainId: ChainId.Codex,
				url: 'https://rpc.codex.xyz',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.CodexTestnet,
		name: 'Codex Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://testnet-explorer.codexchain.io',
		rpcEndpoints: [
			{
				chainId: ChainId.CodexTestnet,
				url: 'https://rpc.codex-stg.xyz',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.Plume,
		name: 'Plume',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://plume-explorer.alt.technology',
		rpcEndpoints: [
			{
				chainId: ChainId.Plume,
				url: 'https://rpc.plume.org',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.PlumeTestnet,
		name: 'Plume Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://testnet-plume-explorer.alt.technology',
		rpcEndpoints: [
			{
				chainId: ChainId.PlumeTestnet,
				url: 'https://testnet-rpc.plume.org',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.CeloSepolia,
		name: 'Celo Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'CELO', symbol: 'CELO' },
		explorerUrl: 'https://celo-sepolia.blockscout.com',
		rpcEndpoints: [
			{
				chainId: ChainId.CeloSepolia,
				url: 'https://forno.celo-sepolia.celo-testnet.org',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.EthereumSepolia,
		name: 'Ethereum Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia.etherscan.io',
		rpcEndpoints: [
			{
				chainId: ChainId.EthereumSepolia,
				url: 'https://ethereum-sepolia-rpc.publicnode.com',
				serviceProvider: ServiceProvider.Public,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.OPSepolia,
		name: 'OP Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia-optimism.etherscan.io',
		rpcEndpoints: [
			{
				chainId: ChainId.OPSepolia,
				url: 'https://sepolia.optimism.io',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
	{
		chainId: ChainId.ArcTestnet,
		name: 'Arc Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://testnet.arcscan.io',
		rpcEndpoints: [
			{
				chainId: ChainId.ArcTestnet,
				url: 'https://rpc.testnet.arc.network',
				serviceProvider: ServiceProvider.Chain,
				transportType: TransportType.Http,
			},
		],
	},
]

export const networks: readonly Network[] = networkConfigs.map((config) => ({
	id: config.chainId,
	name: config.name,
	type: config.type,
}))

export const networkConfigsByChainId = Object.fromEntries(
	networkConfigs.map((config) => [config.chainId, config]),
)

export const networksByChainId = Object.fromEntries(
	networks.map((network) => [network.id, network]),
)

export const explorers: readonly Explorer[] = networkConfigs.flatMap(
	(config) =>
		config.explorerUrl
			? [
					{
						chainId: config.chainId,
						url: config.explorerUrl,
					},
				]
			: [],
)

export const explorerUrls = Object.fromEntries(
	explorers.map((explorer) => [explorer.chainId, explorer.url]),
)

export const getTxUrl = (chainId: number, txHash: string): string =>
	`${explorerUrls[chainId] ?? 'https://blockscan.com'}/tx/${txHash}`

export const getAddressUrl = (chainId: number, address: string): string =>
	`${explorerUrls[chainId] ?? 'https://blockscan.com'}/address/${address}`
