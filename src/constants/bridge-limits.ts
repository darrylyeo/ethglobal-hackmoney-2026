/**
 * USDC bridge amount limits and validation. Amounts in smallest units (6 decimals).
 */

import { formatSmallestToDecimal } from '$/lib/format'

export const USDC_MIN_AMOUNT = 1_000_000n
export const USDC_MAX_AMOUNT = 1_000_000_000_000n

export type AmountValidation = {
	isValid: boolean
	error?: 'too_low' | 'too_high' | 'invalid'
	minAmount?: string
	maxAmount?: string
}

export type RouteLimits = {
	minAmount: bigint | null
	maxAmount: bigint | null
}

export const validateBridgeAmount = (
	amount: bigint,
	minAmount: bigint = USDC_MIN_AMOUNT,
	maxAmount: bigint = USDC_MAX_AMOUNT,
): AmountValidation => {
	if (amount <= 0n) return { isValid: false, error: 'invalid' }
	if (amount < minAmount)
		return {
			isValid: false,
			error: 'too_low',
			minAmount: formatSmallestToDecimal(minAmount, 6),
		}
	if (amount > maxAmount)
		return {
			isValid: false,
			error: 'too_high',
			maxAmount: formatSmallestToDecimal(maxAmount, 6),
		}
	return { isValid: true }
}

export const extractRouteLimits = (
	_routes: { steps: { fromAmount?: string }[] }[],
): RouteLimits => ({ minAmount: null, maxAmount: null })
