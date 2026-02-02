import { ChainId } from '$/constants/networks'

export const CCTP_TOKEN_MESSENGER_MAINNET =
	'0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d' as const
export const CCTP_MESSAGE_TRANSMITTER_MAINNET =
	'0x81D40F21F12A8F0E3252Bccb954D722d4c464B64' as const
export const CCTP_TOKEN_MESSENGER_TESTNET =
	'0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as const
export const CCTP_MESSAGE_TRANSMITTER_TESTNET =
	'0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as const

export const CCTP_DOMAINS_BY_CHAIN_ID: Record<number, number> = {
	[ChainId.Ethereum]: 0,
	[ChainId.EthereumSepolia]: 0,
	[ChainId.Avalanche]: 1,
	[ChainId.AvalancheFuji]: 1,
	[ChainId.Optimism]: 2,
	[ChainId.OPSepolia]: 2,
	[ChainId.Arbitrum]: 3,
	[ChainId.ArbitrumSepolia]: 3,
	[ChainId.Base]: 6,
	[ChainId.BaseSepolia]: 6,
	[ChainId.Polygon]: 7,
	[ChainId.PolygonAmoy]: 7,
	[ChainId.Unichain]: 10,
	[ChainId.UnichainSepolia]: 10,
	[ChainId.Linea]: 11,
	[ChainId.LineaSepolia]: 11,
	[ChainId.Codex]: 12,
	[ChainId.CodexTestnet]: 12,
	[ChainId.Sonic]: 13,
	[ChainId.SonicTestnet]: 13,
	[ChainId.WorldChain]: 14,
	[ChainId.WorldChainSepolia]: 14,
	[ChainId.Monad]: 15,
	[ChainId.MonadTestnet]: 15,
	[ChainId.Sei]: 16,
	[ChainId.SeiTestnet]: 16,
	[ChainId.XDC]: 18,
	[ChainId.XDCApothem]: 18,
	[ChainId.HyperEVM]: 19,
	[ChainId.HyperEVMTestnet]: 19,
	[ChainId.Ink]: 21,
	[ChainId.InkTestnet]: 21,
	[ChainId.Plume]: 22,
	[ChainId.PlumeTestnet]: 22,
	[ChainId.ArcTestnet]: 26,
}

export const CCTP_FORWARDING_CHAIN_IDS = new Set<number>([
	ChainId.ArcTestnet,
	ChainId.Arbitrum,
	ChainId.ArbitrumSepolia,
	ChainId.Avalanche,
	ChainId.AvalancheFuji,
	ChainId.Base,
	ChainId.BaseSepolia,
	ChainId.Ethereum,
	ChainId.EthereumSepolia,
	ChainId.HyperEVM,
	ChainId.HyperEVMTestnet,
	ChainId.Ink,
	ChainId.InkTestnet,
	ChainId.Linea,
	ChainId.LineaSepolia,
	ChainId.Monad,
	ChainId.MonadTestnet,
	ChainId.Optimism,
	ChainId.OPSepolia,
	ChainId.Polygon,
	ChainId.PolygonAmoy,
	ChainId.Sei,
	ChainId.SeiTestnet,
	ChainId.Sonic,
	ChainId.SonicTestnet,
	ChainId.Unichain,
	ChainId.UnichainSepolia,
	ChainId.WorldChain,
	ChainId.WorldChainSepolia,
])

export const CCTP_FAST_TRANSFER_SOURCE_CHAIN_IDS = new Set<number>([
	ChainId.Arbitrum,
	ChainId.ArbitrumSepolia,
	ChainId.Base,
	ChainId.BaseSepolia,
	ChainId.Codex,
	ChainId.CodexTestnet,
	ChainId.Ethereum,
	ChainId.EthereumSepolia,
	ChainId.Ink,
	ChainId.InkTestnet,
	ChainId.Linea,
	ChainId.LineaSepolia,
	ChainId.Optimism,
	ChainId.OPSepolia,
	ChainId.Plume,
	ChainId.PlumeTestnet,
	ChainId.Unichain,
	ChainId.UnichainSepolia,
	ChainId.WorldChain,
	ChainId.WorldChainSepolia,
])

export const getCctpDomainId = (chainId: number | null): number | null =>
	chainId !== null && CCTP_DOMAINS_BY_CHAIN_ID[chainId] !== undefined
		? CCTP_DOMAINS_BY_CHAIN_ID[chainId]
		: null

export const isCctpSupportedChain = (chainId: number | null): boolean =>
	chainId !== null && CCTP_DOMAINS_BY_CHAIN_ID[chainId] !== undefined

export const getCctpTokenMessenger = (
	chainId: number | null,
	isTestnet: boolean,
): `0x${string}` | null =>
	chainId !== null && isCctpSupportedChain(chainId)
		? ((isTestnet
				? CCTP_TOKEN_MESSENGER_TESTNET
				: CCTP_TOKEN_MESSENGER_MAINNET) as `0x${string}`)
		: null

export const getCctpMessageTransmitter = (
	chainId: number | null,
	isTestnet: boolean,
): `0x${string}` | null =>
	chainId !== null && isCctpSupportedChain(chainId)
		? ((isTestnet
				? CCTP_MESSAGE_TRANSMITTER_TESTNET
				: CCTP_MESSAGE_TRANSMITTER_MAINNET) as `0x${string}`)
		: null
