import type { Erc20Token } from '$/constants/coins'

export type Coin$Id = {
	network: number
	address: `0x${string}`
	interopAddress?: string
}

export type CoinEntry = Erc20Token & { $id: Coin$Id }
