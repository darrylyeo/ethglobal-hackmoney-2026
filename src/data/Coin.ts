import type { Erc20Token } from '$/schema/constants/coins'

export type Coin$Id = { network: number; address: `0x${string}` }

export type CoinEntry = Erc20Token & { $id: Coin$Id }
