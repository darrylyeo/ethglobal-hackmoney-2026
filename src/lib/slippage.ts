/**
 * Slippage format/parse and min-output calculation. Constants live in constants/slippage.ts.
 */

import {
	MAX_SLIPPAGE,
	MIN_SLIPPAGE,
} from '$/constants/slippage.ts'

export const formatSlippagePercent = (slippage: number) =>
	`${(slippage * 100).toFixed(2).replace(/\.?0+$/, '')}%`

export const parseSlippagePercent = (value: string) => {
	const num = parseFloat(value.replace('%', ''))
	if (Number.isNaN(num)) return null
	const slippage = num / 100
	if (slippage < MIN_SLIPPAGE || slippage > MAX_SLIPPAGE) return null
	return slippage
}

export const calculateMinOutput = (
	estimatedOutput: bigint,
	slippage: number,
) =>
	(estimatedOutput * BigInt(Math.floor((1 - slippage) * 1_000_000))) /
	1_000_000n
