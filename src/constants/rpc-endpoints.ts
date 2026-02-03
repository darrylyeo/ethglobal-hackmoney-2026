/**
 * Public RPC endpoints by chain: url, serviceProvider, transportType.
 */

import type { RpcEndpoint } from '$/constants/networks'
import { ChainId, ServiceProvider, TransportType } from '$/constants/networks'

export const rpcEndpoints: readonly RpcEndpoint[] = [
	{
		chainId: ChainId.Ethereum,
		url: 'https://mainnet.rpc.buidlguidl.com',
		serviceProvider: ServiceProvider.Public,
		transportType: TransportType.Http,
	},
	// {
	// 	chainId: ChainId.Ethereum,
	// 	url: 'https://eth.llamarpc.com',
	// 	serviceProvider: ServiceProvider.LlamaRPC,
	// 	transportType: TransportType.Http,
	// },
	{
		chainId: ChainId.Optimism,
		url: 'https://mainnet.optimism.io',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.XDC,
		url: 'https://erpc.xinfin.network',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.XDCApothem,
		url: 'https://rpc.apothem.network',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Unichain,
		url: 'https://unichain-rpc.publicnode.com',
		serviceProvider: ServiceProvider.Public,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Monad,
		url: 'https://rpc.monad.xyz',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Sonic,
		url: 'https://rpc.soniclabs.com',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.ZkSyncEraSepolia,
		url: 'https://sepolia.era.zksync.dev',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.ZkSyncEra,
		url: 'https://mainnet.era.zksync.io',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Polygon,
		url: 'https://polygon-rpc.com',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.WorldChain,
		url: 'https://worldchain-mainnet.g.alchemy.com/public',
		serviceProvider: ServiceProvider.Alchemy,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.HyperEVM,
		url: 'https://hyperliquid.drpc.org',
		serviceProvider: ServiceProvider.Public,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.HyperEVMTestnet,
		url: 'https://hyperliquid-testnet.drpc.org',
		serviceProvider: ServiceProvider.Public,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Sei,
		url: 'https://evm-rpc.sei-apis.com',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.SeiTestnet,
		url: 'https://evm-rpc-testnet.sei-apis.com',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Arbitrum,
		url: 'https://arb1.arbitrum.io/rpc',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.ArbitrumSepolia,
		url: 'https://sepolia-rollup.arbitrum.io/rpc',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Avalanche,
		url: 'https://api.avax.network/ext/bc/C/rpc',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.AvalancheFuji,
		url: 'https://api.avax-test.network/ext/bc/C/rpc',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Celo,
		url: 'https://forno.celo.org',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Base,
		url: 'https://mainnet.base.org',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.BaseSepolia,
		url: 'https://sepolia.base.org',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Ink,
		url: 'https://rpc-gel.inkonchain.com',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.InkTestnet,
		url: 'https://rpc-gel-sepolia.inkonchain.com',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Linea,
		url: 'https://rpc.linea.build',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.LineaSepolia,
		url: 'https://rpc.sepolia.linea.build',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.PolygonAmoy,
		url: 'https://rpc-amoy.polygon.technology',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Codex,
		url: 'https://rpc.codex.xyz',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.CodexTestnet,
		url: 'https://rpc.codex-stg.xyz',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.SonicTestnet,
		url: 'https://rpc.testnet.soniclabs.com',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.WorldChainSepolia,
		url: 'https://worldchain-sepolia.g.alchemy.com/public',
		serviceProvider: ServiceProvider.Alchemy,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.MonadTestnet,
		url: 'https://testnet-rpc.monad.xyz',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.Plume,
		url: 'https://rpc.plume.org',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.PlumeTestnet,
		url: 'https://testnet-rpc.plume.org',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.EthereumSepolia,
		url: 'https://ethereum-sepolia-rpc.publicnode.com',
		serviceProvider: ServiceProvider.Public,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.OPSepolia,
		url: 'https://sepolia.optimism.io',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.CeloSepolia,
		url: 'https://forno.celo-sepolia.celo-testnet.org',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.UnichainSepolia,
		url: 'https://sepolia.unichain.org',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
	{
		chainId: ChainId.ArcTestnet,
		url: 'https://rpc.testnet.arc.network',
		serviceProvider: ServiceProvider.Chain,
		transportType: TransportType.Http,
	},
] as const satisfies readonly RpcEndpoint[]

export const rpcUrls: Partial<Record<ChainId, string>> = Object.fromEntries(
	rpcEndpoints.map((e) => [e.chainId, e.url]),
)
