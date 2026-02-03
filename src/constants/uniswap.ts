/**
 * Uniswap V4 contract addresses and fee tiers.
 * PoolManager and Universal Router addresses per chain (placeholder until V4 deployment).
 */

import { ChainId } from '$/constants/networks'

type Address = `0x${string}`

export type UniswapContractAddress = {
	chainId: ChainId
	contract: UniswapContract
	address: Address
}

export type UniswapFeeTier = {
	feeTier: FeeTier
	tickSpacing: number
}

export enum UniswapContract {
	PoolManager = 'PoolManager',
	UniversalRouter = 'UniversalRouter',
}

const placeholderAddress: Address = '0x0000000000000000000000000000000000000000'

export const uniswapContractAddresses = [
	{
		chainId: ChainId.Ethereum,
		contract: UniswapContract.PoolManager,
		address: placeholderAddress,
	},
	{
		chainId: ChainId.Optimism,
		contract: UniswapContract.PoolManager,
		address: placeholderAddress,
	},
	{
		chainId: ChainId.Arbitrum,
		contract: UniswapContract.PoolManager,
		address: placeholderAddress,
	},
	{
		chainId: ChainId.Base,
		contract: UniswapContract.PoolManager,
		address: placeholderAddress,
	},
	{
		chainId: ChainId.Ethereum,
		contract: UniswapContract.UniversalRouter,
		address: placeholderAddress,
	},
	{
		chainId: ChainId.Optimism,
		contract: UniswapContract.UniversalRouter,
		address: placeholderAddress,
	},
	{
		chainId: ChainId.Arbitrum,
		contract: UniswapContract.UniversalRouter,
		address: placeholderAddress,
	},
	{
		chainId: ChainId.Base,
		contract: UniswapContract.UniversalRouter,
		address: placeholderAddress,
	},
] as const satisfies readonly UniswapContractAddress[]

const contractAddressEntries = Object.fromEntries(
	Map.groupBy(uniswapContractAddresses, (entry) => entry.contract)
		.entries()
		.map(([contract, entries]) => [
			contract,
			Object.fromEntries(
				entries.map((entry) => [entry.chainId, entry.address]),
			),
		]),
)

export const POOL_MANAGER_ADDRESS =
	contractAddressEntries[UniswapContract.PoolManager]
export const UNIVERSAL_ROUTER_ADDRESS =
	contractAddressEntries[UniswapContract.UniversalRouter]

export enum FeeTier {
	Lowest = 100,
	Low = 500,
	Medium = 3000,
	High = 10000,
}

export const uniswapFeeTiers = [
	{ feeTier: FeeTier.Lowest, tickSpacing: 1 },
	{ feeTier: FeeTier.Low, tickSpacing: 10 },
	{ feeTier: FeeTier.Medium, tickSpacing: 60 },
	{ feeTier: FeeTier.High, tickSpacing: 200 },
] as const satisfies readonly UniswapFeeTier[]

export const TICK_SPACINGS = Object.fromEntries(
	uniswapFeeTiers.map((tier) => [tier.feeTier, tier.tickSpacing]),
)
