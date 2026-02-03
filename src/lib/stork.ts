import { storkAssetIdByTokenSymbol } from '$/constants/stork'

export const getStorkAssetIdForSymbol = (symbol: string): string | null =>
	storkAssetIdByTokenSymbol[symbol] ?? null
