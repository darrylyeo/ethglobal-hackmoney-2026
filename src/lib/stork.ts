import { storkAssetIdByTokenSymbol } from '$/constants/stork'

export const getStorkAssetIdForSymbol = (symbol: string): string | null =>
	Object.entries(storkAssetIdByTokenSymbol).find(
		([key]) => key === symbol,
	)?.[1] ?? null
