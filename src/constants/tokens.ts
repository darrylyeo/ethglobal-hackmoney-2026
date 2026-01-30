/**
 * Token entries per network from Circle USDC contract addresses.
 */

import { Network } from './networks'

export type Erc20Token = {
	chainId: number
	address: `0x${string}`
	symbol: string
	decimals: number
}

export const tokens = [
	{
		chainId: Network.Ethereum,
		address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
		symbol: 'USDC',
		decimals: 6,
	},
	{
		chainId: Network.Optimism,
		address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
		symbol: 'USDC',
		decimals: 6,
	},
	{
		chainId: Network.Polygon,
		address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
		symbol: 'USDC',
		decimals: 6,
	},
	{
		chainId: Network.Arbitrum,
		address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
		symbol: 'USDC',
		decimals: 6,
	},
	{
		chainId: Network.Avalanche,
		address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
		symbol: 'USDC',
		decimals: 6,
	},
	{
		chainId: Network.Celo,
		address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
		symbol: 'USDC',
		decimals: 6,
	},
	{
		chainId: Network.Base,
		address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
		symbol: 'USDC',
		decimals: 6,
	},
	{
		chainId: Network.Linea,
		address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
		symbol: 'USDC',
		decimals: 6,
	},
	{
		chainId: Network.ZkSyncEra,
		address: '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4',
		symbol: 'USDC',
		decimals: 6,
	},
] as const satisfies readonly Erc20Token[]

export const tokensBySymbolByChainId = (
	Object.fromEntries(
		Map.groupBy(tokens, (token) => token.chainId)
			.entries()
			.map(([chainId, arr]) => [
				Number(chainId),
				Object.fromEntries(arr.map((t) => [t.symbol, t])),
			])
	)
)
