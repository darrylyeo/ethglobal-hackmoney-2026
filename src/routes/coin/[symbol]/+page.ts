import { error } from '@sveltejs/kit'
import type { CoinPageSymbol } from '$/constants/coins.ts'
import { COIN_PAGE_SYMBOLS } from '$/constants/coins.ts'

export function load({ params }) {
	const symbol = params.symbol?.toUpperCase()
	if (!symbol || !COIN_PAGE_SYMBOLS.includes(symbol as CoinPageSymbol))
		throw error(404, 'Unsupported symbol')
	return { symbol: symbol as CoinPageSymbol }
}
