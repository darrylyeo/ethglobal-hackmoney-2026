/**
 * Slippage tolerance for bridge quotes. Values in 0–1 scale (0.005 = 0.5%). LI.FI uses 0–1.
 */

import type { SlippagePreset } from '$/schema/constants/slippage'

export enum SlippagePresetId {
	Low = 'Low',
	Medium = 'Medium',
	High = 'High',
}

export const slippagePresets = [
	{
		id: SlippagePresetId.Low,
		value: 0.001,
	},
	{
		id: SlippagePresetId.Medium,
		value: 0.005,
	},
	{
		id: SlippagePresetId.High,
		value: 0.01,
	},
] as const satisfies readonly SlippagePreset[]

export const SLIPPAGE_PRESETS = slippagePresets.map((preset) => preset.value)
export const DEFAULT_SLIPPAGE = slippagePresets[1].value
export const MIN_SLIPPAGE = 0.0001
export const MAX_SLIPPAGE = 0.5

export const formatSlippagePercent = (slippage: number): string =>
	`${(slippage * 100).toFixed(2).replace(/\.?0+$/, '')}%`

export const parseSlippagePercent = (value: string): number | null => {
	const num = parseFloat(value.replace('%', ''))
	if (Number.isNaN(num)) return null
	const slippage = num / 100
	if (slippage < MIN_SLIPPAGE || slippage > MAX_SLIPPAGE) return null
	return slippage
}

export const calculateMinOutput = (
	estimatedOutput: bigint,
	slippage: number,
): bigint => {
	const factor = BigInt(Math.floor((1 - slippage) * 1_000_000))
	return (estimatedOutput * factor) / 1_000_000n
}
