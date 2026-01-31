/**
 * Public RPC endpoints by chain: url, serviceProvider, transportType.
 */

import { ChainId } from '$/constants/networks'

export enum ServiceProvider {
	Default = 'Default',
	LlamaNodes = 'LlamaNodes',
	Alchemy = 'Alchemy',
}

export enum TransportType {
	Http = 'Http',
	Websocket = 'Websocket',
}

export type RpcEndpoint = {
	chainId: ChainId
	baseUrl: string
	serviceProvider: ServiceProvider
	transportType: TransportType
}

export const rpcEndpoints = [
	{
		chainId: ChainId.Ethereum,
		baseUrl: 'https://eth.llamarpc.com',
		serviceProvider: ServiceProvider.LlamaNodes,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Optimism,
		baseUrl: 'https://mainnet.optimism.io',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.XDC,
		baseUrl: 'https://erpc.xinfin.network',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.XDCApothem,
		baseUrl: 'https://rpc.apothem.network',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Unichain,
		baseUrl: 'https://rpc.unichain.org',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Monad,
		baseUrl: 'https://rpc.monad.xyz',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Sonic,
		baseUrl: 'https://rpc.soniclabs.com',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.ZkSyncEraSepolia,
		baseUrl: 'https://sepolia.era.zksync.dev',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.ZkSyncEra,
		baseUrl: 'https://mainnet.era.zksync.io',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Polygon,
		baseUrl: 'https://polygon-rpc.com',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.WorldChain,
		baseUrl: 'https://rpc.world.org',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.HyperEVM,
		baseUrl: 'https://api.hyperliquid.xyz/evm',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.HyperEVMTestnet,
		baseUrl: 'https://api.hyperliquid-testnet.xyz/evm',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Sei,
		baseUrl: 'https://evm-rpc.sei-apis.com',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.SeiTestnet,
		baseUrl: 'https://evm-rpc.atlantic-2.sei-apis.com',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Arbitrum,
		baseUrl: 'https://arb1.arbitrum.io/rpc',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.ArbitrumSepolia,
		baseUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Avalanche,
		baseUrl: 'https://api.avax.network/ext/bc/C/rpc',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.AvalancheFuji,
		baseUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Celo,
		baseUrl: 'https://forno.celo.org',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Base,
		baseUrl: 'https://mainnet.base.org',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.BaseSepolia,
		baseUrl: 'https://sepolia.base.org',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Ink,
		baseUrl: 'https://rpc-gel.inkonchain.com',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.InkTestnet,
		baseUrl: 'https://rpc-gel-sepolia.inkonchain.com',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Linea,
		baseUrl: 'https://rpc.linea.build',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.LineaSepolia,
		baseUrl: 'https://rpc.sepolia.linea.build',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.PolygonAmoy,
		baseUrl: 'https://rpc-amoy.polygon.technology',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Codex,
		baseUrl: 'https://rpc.codex.xyz',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.CodexTestnet,
		baseUrl: 'https://rpc.codex-stg.xyz',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.SonicTestnet,
		baseUrl: 'https://rpc.testnet.soniclabs.com',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.WorldChainSepolia,
		baseUrl: 'https://worldchain-sepolia.g.alchemy.com/public',
		serviceProvider: ServiceProvider.Alchemy,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.MonadTestnet,
		baseUrl: 'https://testnet-rpc.monad.xyz',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Plume,
		baseUrl: 'https://rpc.plume.org',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.PlumeTestnet,
		baseUrl: 'https://testnet-rpc.plume.org',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.EthereumSepolia,
		baseUrl: 'https://rpc.sepolia.org',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.OPSepolia,
		baseUrl: 'https://sepolia.optimism.io',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.CeloSepolia,
		baseUrl: 'https://forno.celo-sepolia.org',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.UnichainSepolia,
		baseUrl: 'https://sepolia.unichain.org',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.ArcTestnet,
		baseUrl: 'https://rpc.testnet.arc.network',
		serviceProvider: ServiceProvider.Default,
		transportType: TransportType.Http,
	},
] as const satisfies RpcEndpoint[]

export const rpcUrlsByChainId = (
	Object.fromEntries(
		rpcEndpoints.map(({ chainId, baseUrl }) => [
			chainId,
			baseUrl,
		])
	)
)
