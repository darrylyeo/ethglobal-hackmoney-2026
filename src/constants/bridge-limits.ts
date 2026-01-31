/**
 * Bridge amount limits and validation (spec 020).
 * USDC has 6 decimals; amounts in smallest units.
 */

export const DEFAULT_MIN_AMOUNT_USD = 1
export const DEFAULT_MAX_AMOUNT_USD = 1_000_000

export const USDC_MIN_AMOUNT = 1_000_000n
export const USDC_MAX_AMOUNT = 1_000_000_000_000n

export type AmountValidation = {
	isValid: boolean
	error?: 'too_low' | 'too_high' | 'invalid'
	minAmount?: string
	maxAmount?: string
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

function formatSmallestToDecimal(amount: bigint, decimals: number): string {
	const divisor = 10n ** BigInt(decimals)
	const intPart = amount / divisor
	const fracPart = amount % divisor
	const fracPadded = fracPart
		.toString()
		.padStart(decimals, '0')
		.slice(0, decimals)
		.replace(/0+$/, '')
	return fracPadded === '' ? String(intPart) : `${intPart}.${fracPadded}`
}

export type RouteLimits = {
	minAmount: bigint | null
	maxAmount: bigint | null
}

export const extractRouteLimits = (
	_routes: { steps: { fromAmount?: string }[] }[],
): RouteLimits => ({ minAmount: null, maxAmount: null })
