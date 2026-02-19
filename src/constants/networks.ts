/**
 * EVM networks with native USDC per Circle (mainnets and testnets).
 * Chain IDs and names from Circle USDC contract addresses and CCTP docs.
 */

import { ChainId } from '$/constants/chain-id.ts'

export { ChainId } from '$/constants/chain-id.ts'

export enum NetworkType {
	Mainnet = 'Mainnet',
	Testnet = 'Testnet',
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

export type Network = {
	id: ChainId
	name: string
	type: NetworkType
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

export type NetworkConfig = {
	chainId: ChainId
	name: string
	type: NetworkType
	nativeCurrency: NetworkCurrency
	explorerUrls?: string[]
	icon?: string
	/** Primary brand color (hex). */
	color?: string
	slug: string
	caip2: string
}

export type MainnetTestnetMapping = {
	mainnetChainId: ChainId
	testnetChainId: ChainId
}

export type ParsedNetworkParam = {
	chainId: ChainId
	config: NetworkConfig
	slug: string
	caip2: string
}

export const networkConfigs: readonly NetworkConfig[] = await (async () => [
	{
		chainId: ChainId.Ethereum,
		name: 'Ethereum',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://etherscan.io'],
		icon: (await import('$/assets/networks/1-logo.svg?url')).default,
		color: '#627EEA',
	},
	{
		chainId: ChainId.Optimism,
		name: 'OP Mainnet',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://optimistic.etherscan.io'],
		icon: (await import('$/assets/networks/10-symbol.svg?url')).default,
		color: '#FF0823',
	},
	{
		chainId: ChainId.XDC,
		name: 'XDC',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'XDC', symbol: 'XDC' },
		explorerUrls: ['https://xdc.blocksscan.io'],
		icon: (await import('$/assets/networks/50.svg?url')).default,
		color: '#254C81',
	},
	{
		chainId: ChainId.XDCApothem,
		name: 'XDC Apothem',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'XDC', symbol: 'XDC' },
		explorerUrls: ['https://apothem.blocksscan.io'],
		icon: (await import('$/assets/networks/51.svg?url')).default,
		color: '#254C81',
	},
	{
		chainId: ChainId.Unichain,
		name: 'Unichain',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Unichain', symbol: 'UNI' },
		explorerUrls: ['https://unichain.blockscout.com'],
		icon: (await import('$/assets/networks/130.svg?url')).default,
		color: '#F50DB4',
	},
	{
		chainId: ChainId.UnichainSepolia,
		name: 'Unichain Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Unichain', symbol: 'UNI' },
		explorerUrls: ['https://sepolia.unichain.blockscout.com'],
		icon: (await import('$/assets/networks/1301.svg?url')).default,
		color: '#F50DB4',
	},
	{
		chainId: ChainId.Polygon,
		name: 'Polygon PoS',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'MATIC', symbol: 'MATIC' },
		explorerUrls: ['https://polygonscan.com'],
		icon: (await import('$/assets/networks/137.svg?url')).default,
		color: '#7B3FE4',
	},
	{
		chainId: ChainId.PolygonAmoy,
		name: 'Polygon PoS Amoy',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'MATIC', symbol: 'MATIC' },
		explorerUrls: ['https://amoy.polygonscan.com'],
		icon: (await import('$/assets/networks/80002.svg?url')).default,
		color: '#7B3FE4',
	},
	{
		chainId: ChainId.Monad,
		name: 'Monad',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://explorer.monad.xyz'],
		icon: (await import('$/assets/networks/143.svg?url')).default,
		color: '#836EF9',
	},
	{
		chainId: ChainId.MonadTestnet,
		name: 'Monad Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://testnet-explorer.monad.xyz'],
		icon: (await import('$/assets/networks/143.svg?url')).default,
		color: '#836EF9',
	},
	{
		chainId: ChainId.Sonic,
		name: 'Sonic',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'S', symbol: 'S' },
		explorerUrls: ['https://sonicscan.org'],
		icon: (await import('$/assets/networks/146.svg?url')).default,
		color: '#000000',
	},
	{
		chainId: ChainId.SonicTestnet,
		name: 'Sonic Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'S', symbol: 'S' },
		explorerUrls: ['https://testnet.sonicscan.org'],
		icon: (await import('$/assets/networks/14601.svg?url')).default,
		color: '#000000',
	},
	{
		chainId: ChainId.ZkSyncEraSepolia,
		name: 'ZKsync Era Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://sepolia-era.zksync.network'],
		color: '#8C8DFC',
	},
	{
		chainId: ChainId.ZkSyncEra,
		name: 'ZKsync Era',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://era.zksync.network'],
		color: '#8C8DFC',
	},
	{
		chainId: ChainId.WorldChain,
		name: 'World Chain',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://worldscan.org'],
		color: '#111111',
	},
	{
		chainId: ChainId.WorldChainSepolia,
		name: 'World Chain Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://sepolia.worldscan.org'],
		color: '#111111',
	},
	{
		chainId: ChainId.HyperEVMTestnet,
		name: 'HyperEVM Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://testnet.hyper.evm.cc'],
		icon: (await import('$/assets/networks/999-symbol.svg?url')).default,
		color: '#282828',
	},
	{
		chainId: ChainId.HyperEVM,
		name: 'HyperEVM',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://hyper.evm.cc'],
		icon: (await import('$/assets/networks/999-symbol.svg?url')).default,
		color: '#282828',
	},
	{
		chainId: ChainId.SeiTestnet,
		name: 'Sei Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'SEI', symbol: 'SEI' },
		explorerUrls: ['https://testnet.seitrace.com'],
		color: '#C1121F',
	},
	{
		chainId: ChainId.Sei,
		name: 'Sei',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'SEI', symbol: 'SEI' },
		explorerUrls: ['https://seitrace.com'],
		color: '#C1121F',
	},
	{
		chainId: ChainId.Arbitrum,
		name: 'Arbitrum One',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://arbiscan.io'],
		icon: (await import('$/assets/networks/42161-logo.svg?url')).default,
		color: '#12AAFF',
	},
	{
		chainId: ChainId.ArbitrumSepolia,
		name: 'Arbitrum Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://sepolia.arbiscan.io'],
		icon: (await import('$/assets/networks/42161-logo.svg?url')).default,
		color: '#12AAFF',
	},
	{
		chainId: ChainId.Celo,
		name: 'Celo',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'CELO', symbol: 'CELO' },
		explorerUrls: ['https://celoscan.io'],
		icon: (await import('$/assets/networks/Celo.svg?url')).default,
		color: '#FCFF52',
	},
	{
		chainId: ChainId.AvalancheFuji,
		name: 'Avalanche Fuji',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'AVAX', symbol: 'AVAX' },
		explorerUrls: ['https://testnet.snowtrace.io'],
		color: '#E84142',
	},
	{
		chainId: ChainId.Avalanche,
		name: 'Avalanche C-Chain',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'AVAX', symbol: 'AVAX' },
		explorerUrls: ['https://snowtrace.io'],
		color: '#E84142',
	},
	{
		chainId: ChainId.Base,
		name: 'Base',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://basescan.org'],
		color: '#0052FF',
	},
	{
		chainId: ChainId.BaseSepolia,
		name: 'Base Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://sepolia.basescan.org'],
		color: '#0052FF',
	},
	{
		chainId: ChainId.Ink,
		name: 'Ink',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://explorer.inkonchain.com'],
		color: '#6366F1',
	},
	{
		chainId: ChainId.LineaSepolia,
		name: 'Linea Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://sepolia.lineascan.build'],
		color: '#61DFFF',
	},
	{
		chainId: ChainId.Linea,
		name: 'Linea',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://lineascan.build'],
		icon: (await import('$/assets/networks/59144-symbol.svg?url')).default,
		color: '#61DFFF',
	},
	{
		chainId: ChainId.InkTestnet,
		name: 'Ink Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://testnet.explorer.inkonchain.com'],
		icon: (await import('$/assets/networks/763373.svg?url')).default,
		color: '#6366F1',
	},
	{
		chainId: ChainId.Codex,
		name: 'Codex',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://explorer.codexchain.io'],
		icon: (await import('$/assets/networks/81224-logo-and-wordmark.svg?url')).default,
		color: '#E5FF5D',
	},
	{
		chainId: ChainId.CodexTestnet,
		name: 'Codex Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://testnet-explorer.codexchain.io'],
		icon: (await import('$/assets/networks/81224-logo-and-wordmark.svg?url')).default,
		color: '#E5FF5D',
	},
	{
		chainId: ChainId.Plume,
		name: 'Plume',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://plume-explorer.alt.technology'],
		icon: (await import('$/assets/networks/98866-dark.svg?url')).default,
		color: '#E84142',
	},
	{
		chainId: ChainId.PlumeTestnet,
		name: 'Plume Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://testnet-plume-explorer.alt.technology'],
		icon: (await import('$/assets/networks/98867.svg?url')).default,
		color: '#E84142',
	},
	{
		chainId: ChainId.EduChain,
		name: 'EDU Chain',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'EDU', symbol: 'EDU' },
		explorerUrls: ['https://educhain.blockscout.com'],
	},
	{
		chainId: ChainId.Mitosis,
		name: 'Mitosis',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'MITO', symbol: 'MITO' },
		explorerUrls: ['https://mitoscan.io'],
	},
	{
		chainId: ChainId.MitosisTestnet,
		name: 'Mitosis Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'MITO', symbol: 'MITO' },
		explorerUrls: ['https://testnet.mitosiscan.xyz'],
	},
	{
		chainId: ChainId.RiseTestnet,
		name: 'RISE Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://explorer.testnet.riselabs.xyz'],
	},
	{
		chainId: ChainId.Tac,
		name: 'TAC',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'TAC', symbol: 'TAC' },
		explorerUrls: ['https://explorer.tac.build'],
	},
	{
		chainId: ChainId.CeloSepolia,
		name: 'Celo Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'CELO', symbol: 'CELO' },
		explorerUrls: ['https://celo-sepolia.blockscout.com'],
		icon: (await import('$/assets/networks/Celo.svg?url')).default,
		color: '#FCFF52',
	},
	{
		chainId: ChainId.EthereumSepolia,
		name: 'Ethereum Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://sepolia.etherscan.io'],
		icon: (await import('$/assets/networks/1-logo.svg?url')).default,
		color: '#627EEA',
	},
	{
		chainId: ChainId.OPSepolia,
		name: 'OP Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://sepolia-optimism.etherscan.io'],
		icon: (await import('$/assets/networks/11155420.svg?url')).default,
		color: '#FF0823',
	},
	{
		chainId: ChainId.ArcTestnet,
		name: 'Arc Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrls: ['https://testnet.arcscan.io'],
		icon: (await import('$/assets/networks/5042002.svg?url')).default,
		color: '#94A3B8',
	},
])().then((raw) =>
	raw.map((c) => ({
		...c,
		slug: c.name.toLowerCase().replace(/\s+/g, '-'),
		caip2: `eip155:${c.chainId}`,
	})),
)

export const networks: readonly Network[] = networkConfigs.map((config) => ({
	id: config.chainId,
	name: config.name,
	type: config.type,
}))

export const networkConfigsByChainId: Partial<Record<number, NetworkConfig>> =
	Object.fromEntries(networkConfigs.map((config) => [config.chainId, config]))

export const averageTransactionsPerBlockEntries = [
	{ chainId: ChainId.Ethereum, value: 180 },
	{ chainId: ChainId.Optimism, value: 80 },
	{ chainId: ChainId.Arbitrum, value: 100 },
	{ chainId: ChainId.Polygon, value: 120 },
	{ chainId: ChainId.Base, value: 60 },
	{ chainId: ChainId.Linea, value: 40 },
	{ chainId: ChainId.EthereumSepolia, value: 30 },
	{ chainId: ChainId.ArbitrumSepolia, value: 20 },
	{ chainId: ChainId.BaseSepolia, value: 15 },
] as const satisfies readonly { chainId: ChainId; value: number }[]

export const averageTransactionsPerBlockByChainId = Object.fromEntries(
	averageTransactionsPerBlockEntries.map((e) => [e.chainId, e]),
) as Partial<Record<ChainId, (typeof averageTransactionsPerBlockEntries)[number]>>

export const DEFAULT_AVERAGE_TRANSACTIONS_PER_BLOCK = 150

export const networksByChainId: Partial<Record<number, Network>> =
	Object.fromEntries(networks.map((network) => [network.id, network]))

export const mainnetTestnetMappings: readonly MainnetTestnetMapping[] = [
	{ mainnetChainId: ChainId.Ethereum, testnetChainId: ChainId.EthereumSepolia },
	{ mainnetChainId: ChainId.Optimism, testnetChainId: ChainId.OPSepolia },
	{ mainnetChainId: ChainId.XDC, testnetChainId: ChainId.XDCApothem },
	{ mainnetChainId: ChainId.Unichain, testnetChainId: ChainId.UnichainSepolia },
	{ mainnetChainId: ChainId.Polygon, testnetChainId: ChainId.PolygonAmoy },
	{ mainnetChainId: ChainId.Monad, testnetChainId: ChainId.MonadTestnet },
	{ mainnetChainId: ChainId.Sonic, testnetChainId: ChainId.SonicTestnet },
	{
		mainnetChainId: ChainId.ZkSyncEra,
		testnetChainId: ChainId.ZkSyncEraSepolia,
	},
	{
		mainnetChainId: ChainId.WorldChain,
		testnetChainId: ChainId.WorldChainSepolia,
	},
	{ mainnetChainId: ChainId.HyperEVM, testnetChainId: ChainId.HyperEVMTestnet },
	{ mainnetChainId: ChainId.Sei, testnetChainId: ChainId.SeiTestnet },
	{ mainnetChainId: ChainId.Arbitrum, testnetChainId: ChainId.ArbitrumSepolia },
	{ mainnetChainId: ChainId.Celo, testnetChainId: ChainId.CeloSepolia },
	{ mainnetChainId: ChainId.Avalanche, testnetChainId: ChainId.AvalancheFuji },
	{ mainnetChainId: ChainId.Base, testnetChainId: ChainId.BaseSepolia },
	{ mainnetChainId: ChainId.Ink, testnetChainId: ChainId.InkTestnet },
	{ mainnetChainId: ChainId.Linea, testnetChainId: ChainId.LineaSepolia },
	{ mainnetChainId: ChainId.Codex, testnetChainId: ChainId.CodexTestnet },
	{ mainnetChainId: ChainId.Plume, testnetChainId: ChainId.PlumeTestnet },
	{ mainnetChainId: ChainId.Mitosis, testnetChainId: ChainId.MitosisTestnet },
]

export const mainnetIdForTestnetId = Object.fromEntries(
	mainnetTestnetMappings.map((mapping) => [
		mapping.testnetChainId,
		mapping.mainnetChainId,
	]),
)

export const mainnetForTestnet = new Map(
	Object.entries(mainnetIdForTestnetId).map(([testnetId, mainnetId]) => [
		networksByChainId[testnetId]!,
		networksByChainId[mainnetId]!,
	]),
)

export const testnetIdsForMainnetId = Object.fromEntries(
	Array.from(
		Map.groupBy(
			mainnetTestnetMappings,
			(mapping) => mapping.mainnetChainId,
		)
			.entries(),
		([mainnetId, mappings]) => [
			mainnetId,
			mappings.map((m) => m.testnetChainId),
		],
	),
)

export const testnetsForMainnet = new Map(
	Object.entries(testnetIdsForMainnetId).map(([mainnetId, testnetIds]) => [
		networksByChainId[mainnetId]!,
		testnetIds.map((testnetId) => networksByChainId[testnetId]!),
	]),
)

export const networkConfigsBySlug: Partial<Record<string, NetworkConfig>> =
	Object.fromEntries(networkConfigs.map((c) => [c.slug, c]))

export const slugToChainId: Record<string, number> = Object.fromEntries(
	networkConfigs.map((c) => [c.slug, c.chainId]),
)
if (typeof globalThis !== 'undefined') {
	;(globalThis as { __CHAIN_SLUG_TO_CHAIN_ID__?: Record<string, number> }).__CHAIN_SLUG_TO_CHAIN_ID__ =
		slugToChainId
}

export const networkConfigsByCaip2: Partial<Record<string, NetworkConfig>> =
	Object.fromEntries(networkConfigs.map((c) => [c.caip2, c]))

