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
	explorerUrl?: string
	icon?: string
}

export const networkConfigs: readonly NetworkConfig[] = [
	{
		chainId: ChainId.Ethereum,
		name: 'Ethereum',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://etherscan.io',
		icon: '/icons/chains/1-logo.svg',
	},
	{
		chainId: ChainId.Optimism,
		name: 'OP Mainnet',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://optimistic.etherscan.io',
		icon: '/icons/chains/10-symbol.svg',
	},
	{
		chainId: ChainId.XDC,
		name: 'XDC',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'XDC', symbol: 'XDC' },
		explorerUrl: 'https://xdc.blocksscan.io',
		icon: '/icons/chains/50.svg',
	},
	{
		chainId: ChainId.XDCApothem,
		name: 'XDC Apothem',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'XDC', symbol: 'XDC' },
		explorerUrl: 'https://apothem.blocksscan.io',
		icon: '/icons/chains/51.svg',
	},
	{
		chainId: ChainId.Unichain,
		name: 'Unichain',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Unichain', symbol: 'UNI' },
		explorerUrl: 'https://unichain.blockscout.com',
		icon: '/icons/chains/130.svg',
	},
	{
		chainId: ChainId.UnichainSepolia,
		name: 'Unichain Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Unichain', symbol: 'UNI' },
		explorerUrl: 'https://sepolia.unichain.blockscout.com',
		icon: '/icons/chains/1301.svg',
	},
	{
		chainId: ChainId.Polygon,
		name: 'Polygon PoS',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'MATIC', symbol: 'MATIC' },
		explorerUrl: 'https://polygonscan.com',
		icon: '/icons/chains/137.svg',
	},
	{
		chainId: ChainId.PolygonAmoy,
		name: 'Polygon PoS Amoy',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'MATIC', symbol: 'MATIC' },
		explorerUrl: 'https://amoy.polygonscan.com',
		icon: '/icons/chains/80002.svg',
	},
	{
		chainId: ChainId.Monad,
		name: 'Monad',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://explorer.monad.xyz',
		icon: '/icons/chains/143.svg',
	},
	{
		chainId: ChainId.MonadTestnet,
		name: 'Monad Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://testnet-explorer.monad.xyz',
		icon: '/icons/chains/143.svg',
	},
	{
		chainId: ChainId.Sonic,
		name: 'Sonic',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'S', symbol: 'S' },
		explorerUrl: 'https://sonicscan.org',
		icon: '/icons/chains/146.svg',
	},
	{
		chainId: ChainId.SonicTestnet,
		name: 'Sonic Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'S', symbol: 'S' },
		explorerUrl: 'https://testnet.sonicscan.org',
		icon: '/icons/chains/14601.svg',
	},
	{
		chainId: ChainId.ZkSyncEraSepolia,
		name: 'ZKsync Era Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia-era.zksync.network',
	},
	{
		chainId: ChainId.ZkSyncEra,
		name: 'ZKsync Era',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://era.zksync.network',
	},
	{
		chainId: ChainId.WorldChain,
		name: 'World Chain',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://worldscan.org',
	},
	{
		chainId: ChainId.WorldChainSepolia,
		name: 'World Chain Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia.worldscan.org',
	},
	{
		chainId: ChainId.HyperEVMTestnet,
		name: 'HyperEVM Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://testnet.hyper.evm.cc',
		icon: '/icons/chains/999-symbol.svg',
	},
	{
		chainId: ChainId.HyperEVM,
		name: 'HyperEVM',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://hyper.evm.cc',
		icon: '/icons/chains/999-symbol.svg',
	},
	{
		chainId: ChainId.SeiTestnet,
		name: 'Sei Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'SEI', symbol: 'SEI' },
		explorerUrl: 'https://testnet.seitrace.com',
	},
	{
		chainId: ChainId.Sei,
		name: 'Sei',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'SEI', symbol: 'SEI' },
		explorerUrl: 'https://seitrace.com',
	},
	{
		chainId: ChainId.Arbitrum,
		name: 'Arbitrum One',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://arbiscan.io',
		icon: '/icons/chains/42161-logo.svg',
	},
	{
		chainId: ChainId.ArbitrumSepolia,
		name: 'Arbitrum Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia.arbiscan.io',
		icon: '/icons/chains/42161-logo.svg',
	},
	{
		chainId: ChainId.Celo,
		name: 'Celo',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'CELO', symbol: 'CELO' },
		explorerUrl: 'https://celoscan.io',
	},
	{
		chainId: ChainId.AvalancheFuji,
		name: 'Avalanche Fuji',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'AVAX', symbol: 'AVAX' },
		explorerUrl: 'https://testnet.snowtrace.io',
	},
	{
		chainId: ChainId.Avalanche,
		name: 'Avalanche C-Chain',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'AVAX', symbol: 'AVAX' },
		explorerUrl: 'https://snowtrace.io',
	},
	{
		chainId: ChainId.Base,
		name: 'Base',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://basescan.org',
	},
	{
		chainId: ChainId.BaseSepolia,
		name: 'Base Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia.basescan.org',
	},
	{
		chainId: ChainId.Ink,
		name: 'Ink',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://explorer.inkonchain.com',
	},
	{
		chainId: ChainId.LineaSepolia,
		name: 'Linea Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia.lineascan.build',
	},
	{
		chainId: ChainId.Linea,
		name: 'Linea',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://lineascan.build',
		icon: '/icons/chains/59144-symbol.svg',
	},
	{
		chainId: ChainId.InkTestnet,
		name: 'Ink Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://testnet.explorer.inkonchain.com',
		icon: '/icons/chains/763373.svg',
	},
	{
		chainId: ChainId.Codex,
		name: 'Codex',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://explorer.codexchain.io',
		icon: '/icons/chains/81224-logo-and-wordmark.svg',
	},
	{
		chainId: ChainId.CodexTestnet,
		name: 'Codex Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://testnet-explorer.codexchain.io',
		icon: '/icons/chains/81224-logo-and-wordmark.svg',
	},
	{
		chainId: ChainId.Plume,
		name: 'Plume',
		type: NetworkType.Mainnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://plume-explorer.alt.technology',
		icon: '/icons/chains/98866-dark.svg',
	},
	{
		chainId: ChainId.PlumeTestnet,
		name: 'Plume Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://testnet-plume-explorer.alt.technology',
		icon: '/icons/chains/98867.svg',
	},
	{
		chainId: ChainId.CeloSepolia,
		name: 'Celo Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'CELO', symbol: 'CELO' },
		explorerUrl: 'https://celo-sepolia.blockscout.com',
		icon: '/icons/chains/11142220.svg',
	},
	{
		chainId: ChainId.EthereumSepolia,
		name: 'Ethereum Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia.etherscan.io',
		icon: '/icons/chains/1-logo.svg',
	},
	{
		chainId: ChainId.OPSepolia,
		name: 'OP Sepolia',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://sepolia-optimism.etherscan.io',
		icon: '/icons/chains/11155420.svg',
	},
	{
		chainId: ChainId.ArcTestnet,
		name: 'Arc Testnet',
		type: NetworkType.Testnet,
		nativeCurrency: { name: 'Ether', symbol: 'ETH' },
		explorerUrl: 'https://testnet.arcscan.io',
		icon: '/icons/chains/5042002.svg',
	},
]

export const networks: readonly Network[] = networkConfigs.map((config) => ({
	id: config.chainId,
	name: config.name,
	type: config.type,
}))

export const networkConfigsByChainId: Partial<Record<ChainId, NetworkConfig>> =
	Object.fromEntries(networkConfigs.map((config) => [config.chainId, config]))

/**
 * Approximate average transactions per block for placeholder counts when block is unknown.
 * Based on typical chain activity (Ethereum ~150–200, L2s lower). Default 150.
 */
export const averageTransactionsPerBlockByChainId: Partial<
	Record<ChainId, number>
> = {
	[ChainId.Ethereum]: 180,
	[ChainId.Optimism]: 80,
	[ChainId.Arbitrum]: 100,
	[ChainId.Polygon]: 120,
	[ChainId.Base]: 60,
	[ChainId.Linea]: 40,
	[ChainId.EthereumSepolia]: 30,
	[ChainId.ArbitrumSepolia]: 20,
	[ChainId.BaseSepolia]: 15,
}
const DEFAULT_AVERAGE_TRANSACTIONS_PER_BLOCK = 150
export const getAverageTransactionsPerBlock = (chainId: ChainId): number =>
	averageTransactionsPerBlockByChainId[chainId] ??
	DEFAULT_AVERAGE_TRANSACTIONS_PER_BLOCK

export const networksByChainId: Partial<Record<ChainId, Network>> =
	Object.fromEntries(networks.map((network) => [network.id, network]))

export type MainnetTestnetMapping = {
	mainnetChainId: ChainId
	testnetChainId: ChainId
}

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
		).entries(),
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

/** CAIP-2 chain id for EIP-155 (e.g. eip155:1). */
export const toCaip2 = (chainId: number): string => `eip155:${chainId}`

/** Slug from display name: lowercase, spaces → hyphens. */
export const toNetworkSlug = (name: string): string =>
	name.toLowerCase().replace(/\s+/g, '-')

const slugToChainId: Partial<Record<string, ChainId>> = Object.fromEntries(
	networkConfigs.map((config) => [toNetworkSlug(config.name), config.chainId]),
)

export const getNetworkBySlug = (slug: string): NetworkConfig | null => {
	const chainId = slugToChainId[slug.toLowerCase()]
	return chainId != null ? (networkConfigsByChainId[chainId] ?? null) : null
}

export const getNetworkByCaip2 = (caip2: string): NetworkConfig | null => {
	const match = /^eip155:(\d+)$/.exec(caip2)
	const chainId = match ? (Number(match[1]) as ChainId) : null
	return chainId != null ? (networkConfigsByChainId[chainId] ?? null) : null
}

export type ParsedNetworkParam = {
	chainId: ChainId
	config: NetworkConfig
	slug: string
	caip2: string
}

/** Resolve [name] from /network/[name]: slug, eip155:chainId, or numeric chainId. */
export const parseNetworkNameParam = (
	name: string,
): ParsedNetworkParam | null => {
	const decoded = decodeURIComponent(name)
	if (/^\d+$/.test(decoded)) {
		const config = networkConfigsByChainId[Number(decoded) as ChainId] ?? null
		return config
			? {
					chainId: config.chainId,
					config,
					slug: toNetworkSlug(config.name),
					caip2: toCaip2(config.chainId),
				}
			: null
	}
	if (decoded.includes(':')) {
		const config = getNetworkByCaip2(decoded)
		return config
			? {
					chainId: config.chainId,
					config,
					slug: toNetworkSlug(config.name),
					caip2: toCaip2(config.chainId),
				}
			: null
	}
	const config = getNetworkBySlug(decoded)
	return config
		? {
				chainId: config.chainId,
				config,
				slug: toNetworkSlug(config.name),
				caip2: toCaip2(config.chainId),
			}
		: null
}
