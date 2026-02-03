import type { ChainId } from '$/constants/networks'
import type { FeeTier, UniswapContract } from '$/constants/uniswap'

export type UniswapContractAddress = {
	chainId: ChainId
	contract: UniswapContract
	address: `0x${string}`
}

export type UniswapFeeTier = {
	feeTier: FeeTier
	tickSpacing: number
}
