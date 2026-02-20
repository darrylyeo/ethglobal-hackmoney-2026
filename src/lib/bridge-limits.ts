/**
 * Bridge amount validation and route limits. Constants live in constants/bridge-limits.ts.
 */

import type { AmountValidation, RouteLimits } from '$/constants/bridge-limits.ts'
import {
	AmountValidationError,
	USDC_MAX_AMOUNT,
	USDC_MIN_AMOUNT,
} from '$/constants/bridge-limits.ts'
import { formatSmallestToDecimal } from '$/lib/format.ts'

export type { AmountValidation, RouteLimits }

export const validateBridgeAmount = (
	amount: bigint,
	minAmount: bigint = USDC_MIN_AMOUNT,
	maxAmount: bigint = USDC_MAX_AMOUNT,
): AmountValidation => {
	if (amount <= 0n)
		return { isValid: false, error: AmountValidationError.Invalid }
	if (amount < minAmount)
		return {
			isValid: false,
			error: AmountValidationError.TooLow,
			minAmount: formatSmallestToDecimal(minAmount, 6),
		}
	if (amount > maxAmount)
		return {
			isValid: false,
			error: AmountValidationError.TooHigh,
			maxAmount: formatSmallestToDecimal(maxAmount, 6),
		}
	return { isValid: true }
}

export const extractRouteLimits = (
	routes: { fromAmount: bigint }[],
): RouteLimits =>
	routes.length === 0
		? { minAmount: null, maxAmount: null }
		: {
				minAmount: routes.reduce(
					(a, r) => (r.fromAmount < a ? r.fromAmount : a),
					routes[0].fromAmount,
				),
				maxAmount: routes.reduce(
					(a, r) => (r.fromAmount > a ? r.fromAmount : a),
					routes[0].fromAmount,
				),
			}
