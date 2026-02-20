/**
 * Token entries per network from Circle USDC contract addresses.
 */

import type { Media } from '$/constants/media.ts'
import { ChainId, networksByChainId } from '$/constants/networks.ts'
import { normalizeAddress } from '$/lib/address.ts'

export enum CoinType {
	Native = 'Native',
	Erc20 = 'Erc20',
}

export type NativeCurrency = {
	type: CoinType.Native
	name?: string
	chainId: ChainId
	address: `0x${string}`
	symbol: string
	decimals: number
	icon?: Media
}

export type Erc20Token = {
	type: CoinType.Erc20
	name?: string
	chainId: ChainId
	address: `0x${string}`
	symbol: string
	decimals: number
	icon?: Media
}

export type Coin = NativeCurrency | Erc20Token

export enum CoinSymbol {
	USDC = 'USDC',
	ETH = 'ETH',
}

export const coinSymbolEntries: readonly { symbol: CoinSymbol }[] = (
	Object.values(CoinSymbol) as CoinSymbol[]
).map((symbol) => ({ symbol }))

export const COIN_SYMBOLS: readonly CoinSymbol[] = (
	Object.values(CoinSymbol) as CoinSymbol[]
)

export enum CoinColorSymbol {
	ETH = 'ETH',
	USDC = 'USDC',
	USDT = 'USDT',
	MATIC = 'MATIC',
	AVAX = 'AVAX',
	CELO = 'CELO',
	UNI = 'UNI',
	S = 'S',
	XDC = 'XDC',
	EDU = 'EDU',
	MITO = 'MITO',
	TAC = 'TAC',
}

export const coinColorEntries = [
	{ symbol: CoinColorSymbol.ETH, color: '#627EEA' },
	{ symbol: CoinColorSymbol.USDC, color: '#2775CA' },
	{ symbol: CoinColorSymbol.USDT, color: '#26A17B' },
	{ symbol: CoinColorSymbol.MATIC, color: '#7B3FE4' },
	{ symbol: CoinColorSymbol.AVAX, color: '#E84142' },
	{ symbol: CoinColorSymbol.CELO, color: '#FCFF52' },
	{ symbol: CoinColorSymbol.UNI, color: '#F50DB4' },
	{ symbol: CoinColorSymbol.S, color: '#000000' },
	{ symbol: CoinColorSymbol.XDC, color: '#254C81' },
	{ symbol: CoinColorSymbol.EDU, color: '#7C3AED' },
	{ symbol: CoinColorSymbol.MITO, color: '#6366F1' },
	{ symbol: CoinColorSymbol.TAC, color: '#3B82F6' },
] as const satisfies readonly { symbol: CoinColorSymbol; color: string }[]

export const coinColorBySymbol = Object.fromEntries(
	coinColorEntries.map((e) => [e.symbol, e]),
) as Record<CoinColorSymbol, (typeof coinColorEntries)[number]>

export const ercTokens = (
	[
		{
			chainId: ChainId.Ethereum,
			address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Optimism,
			address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Polygon,
			address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Arbitrum,
			address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Avalanche,
			address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Celo,
			address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Base,
			address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Linea,
			address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.ZkSyncEra,
			address: '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Unichain,
			address: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Monad,
			address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Sonic,
			address: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Codex,
			address: '0xd996633a415985DBd7D6D12f4A4343E31f5037cf',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.HyperEVM,
			address: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Ink,
			address: '0x2D270e6886d130D724215A266106e6832161EAEd',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Sei,
			address: '0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.Plume,
			address: '0x222365EF19F7947e5484218551B56bb3965Aa7aF',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.WorldChain,
			address: '0x79A02482A880bCe3F13E09da970dC34dB4cD24D1',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.XDC,
			address: '0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.EthereumSepolia,
			address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.OPSepolia,
			address: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.BaseSepolia,
			address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.ArbitrumSepolia,
			address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.PolygonAmoy,
			address: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.UnichainSepolia,
			address: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.LineaSepolia,
			address: '0xFEce4462D57bD51A6A552365A011b95f0E16d9B7',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.CodexTestnet,
			address: '0x6d7f141b6819C2c9CC2f818e6ad549E7Ca090F8f',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.SonicTestnet,
			address: '0x0BA304580ee7c9a980CF72e55f5Ed2E9fd30Bc51',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.WorldChainSepolia,
			address: '0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.MonadTestnet,
			address: '0x534b2f3A21130d7a60830c2Df862319e593943A3',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.SeiTestnet,
			address: '0x4fCF1784B31630811181f670Aea7A7bEF803eaED',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.XDCApothem,
			address: '0xb5AB69F7bBada22B28e79C8FFAECe55eF1c771D4',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.HyperEVMTestnet,
			address: '0x2B3370eE501B4a559b57D449569354196457D8Ab',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.InkTestnet,
			address: '0xFabab97dCE620294D2B0b0e46C68964e326300Ac',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.PlumeTestnet,
			address: '0xcB5f30e335672893c7eb944B374c196392C19D18',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.ArcTestnet,
			address: '0x3600000000000000000000000000000000000000',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.CeloSepolia,
			address: '0x01C5C0122039549AD1493B8220cABEdD739BC44E',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.ZkSyncEraSepolia,
			address: '0xAe045DE5638162fa134807Cb558E15A3F5A7F853',
			symbol: 'USDC',
			decimals: 6,
		},
		{
			chainId: ChainId.AvalancheFuji,
			address: '0x5425890298aed601595a70AB815c96711a31Bc65',
			symbol: 'USDC',
			decimals: 6,
		},
		// WETH (and native-equivalent) for swap/liquidity/transfer/bridge
		{ chainId: ChainId.Ethereum, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
		{ chainId: ChainId.Optimism, address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
		{ chainId: ChainId.Base, address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
		{ chainId: ChainId.Arbitrum, address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', decimals: 18 },
		{ chainId: ChainId.Polygon, address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', decimals: 18 },
		{ chainId: ChainId.Avalanche, address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', symbol: 'WETH.e', decimals: 18 },
		{ chainId: ChainId.Linea, address: '0xe5D7C2a6Ff5bbEcF3E41aF8F5b8e4B4e5e5e5e5', symbol: 'WETH', decimals: 18 },
		{ chainId: ChainId.EthereumSepolia, address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', symbol: 'WETH', decimals: 18 },
		{ chainId: ChainId.OPSepolia, address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
		{ chainId: ChainId.BaseSepolia, address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
		{ chainId: ChainId.ArbitrumSepolia, address: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73', symbol: 'WETH', decimals: 18 },
		{ chainId: ChainId.PolygonAmoy, address: '0x7b79995e5f793A4712D92A3c7e7c1B945100F8d', symbol: 'WETH', decimals: 18 },
		{ chainId: ChainId.LineaSepolia, address: '0x2C1b868d6596a18e32e61B901E4060C872647b6C', symbol: 'WETH', decimals: 18 },
		{ chainId: ChainId.AvalancheFuji, address: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c', symbol: 'WETH', decimals: 18 },
	] as const
).map((token) => ({
	type: CoinType.Erc20,
	...token,
	address: (normalizeAddress(token.address) ?? token.address) as `0x${string}`,
})) satisfies readonly Erc20Token[]

export const ercTokensBySymbolByChainId = Object.fromEntries(
	Map.groupBy(ercTokens, (token) => token.chainId)
		.entries()
		.map(([chainId, tokens]) => [
			Number(chainId),
			Object.fromEntries(tokens.map((token) => [token.symbol, token])),
		]),
)

const zeroAddress = '0x0000000000000000000000000000000000000000' as `0x${string}`

export const coinSymbolCoinEntries: readonly { symbol: CoinSymbol; coin: Coin }[] = [
	{
		symbol: CoinSymbol.USDC,
		coin: ercTokens[0],
	},
	{
		symbol: CoinSymbol.ETH,
		coin: {
			type: CoinType.Native,
			chainId: ChainId.Ethereum,
			address: zeroAddress,
			symbol: 'ETH',
			decimals: 18,
		},
	},
]

export const coinBySymbol = Object.fromEntries(
	coinSymbolCoinEntries.map((e) => [e.symbol, e.coin]),
) as Record<CoinSymbol, Coin>

export const bridgeCoinsByChainId: Partial<Record<number, Coin[]>> =
	Object.fromEntries(
		Object.entries(networksByChainId).map(([chainIdStr, network]) => {
			const chainId = Number(chainIdStr)
			const chainTokens = ercTokens.filter((t) => t.chainId === chainId)
			const native: Coin | null =
				network ?
					{
						type: CoinType.Native,
						chainId: chainId as ChainId,
						address: zeroAddress,
						symbol: network.nativeCurrency.symbol,
						decimals: 18,
					}
				: null
			return [chainId, [native, ...chainTokens].filter(Boolean) as Coin[]]
		}),
	)

