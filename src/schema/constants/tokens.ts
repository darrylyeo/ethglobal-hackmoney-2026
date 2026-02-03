import type { TokenSymbol } from '$/constants/tokens'

export type Erc20Token = {
	chainId: number
	address: `0x${string}`
	symbol: TokenSymbol
	decimals: number
}
