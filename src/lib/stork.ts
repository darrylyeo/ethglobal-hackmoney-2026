import { storkAssetIdByTokenSymbol } from '$/constants/stork.ts'

export const getStorkAssetIdForSymbol = (symbol: string): string | null =>
	storkAssetIdByTokenSymbol[symbol] ?? null
