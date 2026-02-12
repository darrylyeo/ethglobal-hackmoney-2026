import type { Erc20Token } from '$/constants/coins.ts'
import type { Network$Id } from '$/data/Network.ts'

export type Coin$Id = {
	$network: Network$Id
	address: `0x${string}`
	interopAddress?: string
}

export type CoinEntry = Erc20Token & { $id: Coin$Id }
