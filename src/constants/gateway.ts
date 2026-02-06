import { ChainId } from '$/constants/networks.ts'

/**
 * Circle Gateway domain IDs per chain (EVM only; same domain IDs as CCTP where overlapping).
 * https://developers.circle.com/gateway/references/supported-blockchains
 */
export const GATEWAY_DOMAINS_BY_CHAIN_ID: Partial<Record<ChainId, number>> = {
	[ChainId.Ethereum]: 0,
	[ChainId.EthereumSepolia]: 0,
	[ChainId.Avalanche]: 1,
	[ChainId.AvalancheFuji]: 1,
	[ChainId.Optimism]: 2,
	[ChainId.OPSepolia]: 2,
	[ChainId.Arbitrum]: 3,
	[ChainId.Base]: 6,
	[ChainId.BaseSepolia]: 6,
	[ChainId.Polygon]: 7,
	[ChainId.Unichain]: 10,
	[ChainId.UnichainSepolia]: 10,
	[ChainId.Sonic]: 13,
	[ChainId.SonicTestnet]: 13,
	[ChainId.WorldChain]: 14,
	[ChainId.WorldChainSepolia]: 14,
	[ChainId.Sei]: 16,
	[ChainId.SeiTestnet]: 16,
	[ChainId.HyperEVM]: 19,
	[ChainId.HyperEVMTestnet]: 19,
	[ChainId.ArcTestnet]: 26,
}

/** EVM chains that have Gateway Wallet/Minter deployed (testnet). */
const GATEWAY_TESTNET_CHAIN_IDS = new Set<ChainId>([
	ChainId.ArcTestnet,
	ChainId.AvalancheFuji,
	ChainId.BaseSepolia,
	ChainId.EthereumSepolia,
	ChainId.HyperEVMTestnet,
	ChainId.SeiTestnet,
	ChainId.SonicTestnet,
	ChainId.WorldChainSepolia,
])

/** EVM chains that have Gateway Wallet/Minter deployed (mainnet). */
const GATEWAY_MAINNET_CHAIN_IDS = new Set<ChainId>([
	ChainId.Arbitrum,
	ChainId.Avalanche,
	ChainId.Base,
	ChainId.Ethereum,
	ChainId.HyperEVM,
	ChainId.Optimism,
	ChainId.Polygon,
	ChainId.Sei,
	ChainId.Sonic,
	ChainId.Unichain,
	ChainId.WorldChain,
])

export const GATEWAY_API_BASE_TESTNET = 'https://gateway-api-testnet.circle.com'
export const GATEWAY_API_BASE_MAINNET = 'https://gateway-api.circle.com'

export const GATEWAY_WALLET_TESTNET =
	'0x0077777d7EBA4688BDeF3E311b846F25870A19B9' as const
export const GATEWAY_MINTER_TESTNET =
	'0x0022222ABE238Cc2C7Bb1f21003F0a260052475B' as const
export const GATEWAY_WALLET_MAINNET =
	'0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE' as const
export const GATEWAY_MINTER_MAINNET =
	'0x2222222d7164433c4C09B0b0D809a9b52C04C205' as const

export const getGatewayDomainId = (chainId: ChainId | null): number | null =>
	chainId === null ? null : (GATEWAY_DOMAINS_BY_CHAIN_ID[chainId] ?? null)

export const isGatewaySupportedChain = (
	chainId: number | null,
	isTestnet: boolean,
): boolean =>
	chainId !== null &&
	(isTestnet
		? GATEWAY_TESTNET_CHAIN_IDS.has(chainId as ChainId)
		: GATEWAY_MAINNET_CHAIN_IDS.has(chainId as ChainId))

export const getGatewayWalletAddress = (
	chainId: ChainId | null,
	isTestnet: boolean,
): `0x${string}` | null =>
	chainId !== null && isGatewaySupportedChain(chainId, isTestnet)
		? (isTestnet ? GATEWAY_WALLET_TESTNET : GATEWAY_WALLET_MAINNET)
		: null

export const getGatewayMinterAddress = (
	chainId: ChainId | null,
	isTestnet: boolean,
): `0x${string}` | null =>
	chainId !== null && isGatewaySupportedChain(chainId, isTestnet)
		? (isTestnet ? GATEWAY_MINTER_TESTNET : GATEWAY_MINTER_MAINNET)
		: null

export const getGatewayApiBase = (isTestnet: boolean): string =>
	isTestnet ? GATEWAY_API_BASE_TESTNET : GATEWAY_API_BASE_MAINNET
