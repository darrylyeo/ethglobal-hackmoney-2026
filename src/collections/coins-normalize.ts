import type { Erc20Token } from '$/constants/coins'

export const normalizeCoin = (entry: Erc20Token): Erc20Token => ({
	chainId: entry.chainId,
	address: entry.address,
	symbol: entry.symbol,
	decimals: entry.decimals,
})
