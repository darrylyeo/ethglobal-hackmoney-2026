/**
 * Token entries per network from Circle USDC contract addresses.
 */

import { ChainId } from './networks'

export enum TokenSymbol {
	Usdc = 'USDC',
}

export type Erc20Token = {
	chainId: number
	address: `0x${string}`
	symbol: TokenSymbol
	decimals: number
}

export const tokens = [
	{
		chainId: ChainId.Ethereum,
		address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Optimism,
		address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Polygon,
		address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Arbitrum,
		address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Avalanche,
		address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Celo,
		address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Base,
		address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Linea,
		address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.ZkSyncEra,
		address: '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Unichain,
		address: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Monad,
		address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Sonic,
		address: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Codex,
		address: '0xd996633a415985DBd7D6D12f4A4343E31f5037cf',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.HyperEVM,
		address: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Ink,
		address: '0x2D270e6886d130D724215A266106e6832161EAEd',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Sei,
		address: '0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.Plume,
		address: '0x222365EF19F7947e5484218551B56bb3965Aa7aF',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.WorldChain,
		address: '0x79A02482A880bCe3F13E09da970dC34dB4cD24D1',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.XDC,
		address: '0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.EthereumSepolia,
		address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.OPSepolia,
		address: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.BaseSepolia,
		address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.ArbitrumSepolia,
		address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.PolygonAmoy,
		address: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.UnichainSepolia,
		address: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.LineaSepolia,
		address: '0xFEce4462D57bD51A6A552365A011b95f0E16d9B7',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.CodexTestnet,
		address: '0x6d7f141b6819C2c9CC2f818e6ad549E7Ca090F8f',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.SonicTestnet,
		address: '0x0BA304580ee7c9a980CF72e55f5Ed2E9fd30Bc51',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.WorldChainSepolia,
		address: '0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.MonadTestnet,
		address: '0x534b2f3A21130d7a60830c2Df862319e593943A3',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.SeiTestnet,
		address: '0x4fCF1784B31630811181f670Aea7A7bEF803eaED',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.XDCApothem,
		address: '0xb5AB69F7bBada22B28e79C8FFAECe55eF1c771D4',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.HyperEVMTestnet,
		address: '0x2B3370eE501B4a559b57D449569354196457D8Ab',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.InkTestnet,
		address: '0xFabab97dCE620294D2B0b0e46C68964e326300Ac',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.PlumeTestnet,
		address: '0xcB5f30e335672893c7eb944B374c196392C19D18',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.ArcTestnet,
		address: '0x3600000000000000000000000000000000000000',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.CeloSepolia,
		address: '0x01C5C0122039549AD1493B8220cABEdD739BC44E',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.ZkSyncEraSepolia,
		address: '0xAe045DE5638162fa134807Cb558E15A3F5A7F853',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
	{
		chainId: ChainId.AvalancheFuji,
		address: '0x5425890298aed601595a70AB815c96711a31Bc65',
		symbol: TokenSymbol.Usdc,
		decimals: 6,
	},
] as const satisfies readonly Erc20Token[]

export const tokensBySymbolByChainId = (
	Object.fromEntries(
		Map.groupBy(tokens, (token) => token.chainId)
			.entries()
			.map(([chainId, tokens]) => [
				Number(chainId),
				Object.fromEntries(tokens.map((token) => [
					token.symbol,
					token,
				])),
			])
	)
)
