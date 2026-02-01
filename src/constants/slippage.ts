/**
 * Slippage tolerance for bridge quotes. Values in 0–1 scale (0.005 = 0.5%). LI.FI uses 0–1.
 */

export const SLIPPAGE_PRESETS = [0.001, 0.005, 0.01] as const
export const DEFAULT_SLIPPAGE = 0.005
export const MIN_SLIPPAGE = 0.0001
export const MAX_SLIPPAGE = 0.5

export const formatSlippagePercent = (slippage: number): string => (
	`${(slippage * 100).toFixed(2).replace(/\.?0+$/, '')}%`
)

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
