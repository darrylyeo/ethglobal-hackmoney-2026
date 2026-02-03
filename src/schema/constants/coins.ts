import type { CoinType } from '$/constants/coins'
import type { Media } from './media'

export type Coin = NativeCurrency | Erc20Token

export type NativeCurrency = {
	type: CoinType.Native
	name?: string
	chainId: number
	address: `0x${string}`
	symbol: string
	decimals: number
	icon?: Media
}

export type Erc20Token = {
	type: CoinType.Erc20
	name?: string
	chainId: number
	address: `0x${string}`
	symbol: string
	decimals: number
	icon?: Media
}
