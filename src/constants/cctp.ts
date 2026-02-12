import { ChainId } from '$/constants/networks.ts'

export const CCTP_TOKEN_MESSENGER_MAINNET =
	'0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d' as const
export const CCTP_MESSAGE_TRANSMITTER_MAINNET =
	'0x81D40F21F12A8F0E3252Bccb954D722d4c464B64' as const
export const CCTP_TOKEN_MESSENGER_TESTNET =
	'0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as const
export const CCTP_MESSAGE_TRANSMITTER_TESTNET =
	'0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as const

export const cctpDomainEntries = [
	{ chainId: ChainId.Ethereum, domain: 0 },
	{ chainId: ChainId.EthereumSepolia, domain: 0 },
	{ chainId: ChainId.Avalanche, domain: 1 },
	{ chainId: ChainId.AvalancheFuji, domain: 1 },
	{ chainId: ChainId.Optimism, domain: 2 },
	{ chainId: ChainId.OPSepolia, domain: 2 },
	{ chainId: ChainId.Arbitrum, domain: 3 },
	{ chainId: ChainId.ArbitrumSepolia, domain: 3 },
	{ chainId: ChainId.Base, domain: 6 },
	{ chainId: ChainId.BaseSepolia, domain: 6 },
	{ chainId: ChainId.Polygon, domain: 7 },
	{ chainId: ChainId.PolygonAmoy, domain: 7 },
	{ chainId: ChainId.Unichain, domain: 10 },
	{ chainId: ChainId.UnichainSepolia, domain: 10 },
	{ chainId: ChainId.Linea, domain: 11 },
	{ chainId: ChainId.LineaSepolia, domain: 11 },
	{ chainId: ChainId.Codex, domain: 12 },
	{ chainId: ChainId.CodexTestnet, domain: 12 },
	{ chainId: ChainId.Sonic, domain: 13 },
	{ chainId: ChainId.SonicTestnet, domain: 13 },
	{ chainId: ChainId.WorldChain, domain: 14 },
	{ chainId: ChainId.WorldChainSepolia, domain: 14 },
	{ chainId: ChainId.Monad, domain: 15 },
	{ chainId: ChainId.MonadTestnet, domain: 15 },
	{ chainId: ChainId.Sei, domain: 16 },
	{ chainId: ChainId.SeiTestnet, domain: 16 },
	{ chainId: ChainId.XDC, domain: 18 },
	{ chainId: ChainId.XDCApothem, domain: 18 },
	{ chainId: ChainId.HyperEVM, domain: 19 },
	{ chainId: ChainId.HyperEVMTestnet, domain: 19 },
	{ chainId: ChainId.Ink, domain: 21 },
	{ chainId: ChainId.InkTestnet, domain: 21 },
	{ chainId: ChainId.Plume, domain: 22 },
	{ chainId: ChainId.PlumeTestnet, domain: 22 },
	{ chainId: ChainId.ArcTestnet, domain: 26 },
] as const satisfies readonly { chainId: ChainId; domain: number }[]

export const cctpDomainByChainId = Object.fromEntries(
	cctpDomainEntries.map((e) => [e.chainId, e]),
) as Partial<Record<ChainId, (typeof cctpDomainEntries)[number]>>

export const CCTP_TESTNET_CHAIN_IDS = new Set<ChainId>([
	ChainId.ArcTestnet,
	ChainId.ArbitrumSepolia,
	ChainId.AvalancheFuji,
	ChainId.BaseSepolia,
	ChainId.CodexTestnet,
	ChainId.EthereumSepolia,
	ChainId.HyperEVMTestnet,
	ChainId.InkTestnet,
	ChainId.LineaSepolia,
	ChainId.MonadTestnet,
	ChainId.OPSepolia,
	ChainId.PlumeTestnet,
	ChainId.PolygonAmoy,
	ChainId.SeiTestnet,
	ChainId.SonicTestnet,
	ChainId.UnichainSepolia,
	ChainId.WorldChainSepolia,
	ChainId.XDCApothem,
])

export const isCctpTestnetChain = (chainId: ChainId): boolean =>
	CCTP_TESTNET_CHAIN_IDS.has(chainId)

export const CCTP_FORWARDING_CHAIN_IDS = new Set<ChainId>([
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

export const CCTP_FAST_TRANSFER_SOURCE_CHAIN_IDS = new Set<ChainId>([
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
