import { ChainId } from '$/constants/networks.ts'

/**
 * Circle Gateway domain IDs per chain (EVM only; same domain IDs as CCTP where overlapping).
 * https://developers.circle.com/gateway/references/supported-blockchains
 */
export const gatewayDomainEntries = [
	{ chainId: ChainId.Ethereum, domain: 0 },
	{ chainId: ChainId.EthereumSepolia, domain: 0 },
	{ chainId: ChainId.Avalanche, domain: 1 },
	{ chainId: ChainId.AvalancheFuji, domain: 1 },
	{ chainId: ChainId.Optimism, domain: 2 },
	{ chainId: ChainId.OPSepolia, domain: 2 },
	{ chainId: ChainId.Arbitrum, domain: 3 },
	{ chainId: ChainId.Base, domain: 6 },
	{ chainId: ChainId.BaseSepolia, domain: 6 },
	{ chainId: ChainId.Polygon, domain: 7 },
	{ chainId: ChainId.Unichain, domain: 10 },
	{ chainId: ChainId.UnichainSepolia, domain: 10 },
	{ chainId: ChainId.Sonic, domain: 13 },
	{ chainId: ChainId.SonicTestnet, domain: 13 },
	{ chainId: ChainId.WorldChain, domain: 14 },
	{ chainId: ChainId.WorldChainSepolia, domain: 14 },
	{ chainId: ChainId.Sei, domain: 16 },
	{ chainId: ChainId.SeiTestnet, domain: 16 },
	{ chainId: ChainId.HyperEVM, domain: 19 },
	{ chainId: ChainId.HyperEVMTestnet, domain: 19 },
	{ chainId: ChainId.ArcTestnet, domain: 26 },
] as const satisfies readonly { chainId: ChainId; domain: number }[]

export const gatewayDomainByChainId = Object.fromEntries(
	gatewayDomainEntries.map((e) => [e.chainId, e]),
) as Partial<Record<ChainId, (typeof gatewayDomainEntries)[number]>>

export const GATEWAY_TESTNET_CHAIN_IDS = new Set<ChainId>([
	ChainId.ArcTestnet,
	ChainId.AvalancheFuji,
	ChainId.BaseSepolia,
	ChainId.EthereumSepolia,
	ChainId.HyperEVMTestnet,
	ChainId.SeiTestnet,
	ChainId.SonicTestnet,
	ChainId.WorldChainSepolia,
])

export const GATEWAY_MAINNET_CHAIN_IDS = new Set<ChainId>([
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
