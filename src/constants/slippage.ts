/**
 * Slippage tolerance for bridge quotes. Values in 0–1 scale (0.005 = 0.5%). LI.FI uses 0–1.
 */

export enum SlippagePresetId {
	Low = 'Low',
	Medium = 'Medium',
	High = 'High',
}

export type SlippagePreset = {
	id: SlippagePresetId
	value: number
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

export const slippagePresetById = Object.fromEntries(
	slippagePresets.map((e) => [e.id, e]),
) as Record<SlippagePresetId, (typeof slippagePresets)[number]>

export const DEFAULT_SLIPPAGE = slippagePresetById[SlippagePresetId.Medium].value
export const MIN_SLIPPAGE = 0.0001
export const MAX_SLIPPAGE = 0.5
