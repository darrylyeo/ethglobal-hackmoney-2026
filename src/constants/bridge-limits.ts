/**
 * USDC bridge amount limits and validation. Amounts in smallest units (6 decimals).
 */

import { formatSmallestToDecimal } from '$/lib/format.ts'

export enum BridgeAsset {
	Usdc = 'USDC',
}

export type BridgeLimit = {
	asset: BridgeAsset
	minAmount: bigint
	maxAmount: bigint
}

export enum AmountValidationError {
	TooLow = 'too_low',
	TooHigh = 'too_high',
	Invalid = 'invalid',
}

export type AmountValidation = {
	isValid: boolean
	error?: AmountValidationError
	minAmount?: string
	maxAmount?: string
}

export type RouteLimits = {
	minAmount: bigint | null
	maxAmount: bigint | null
}

export const bridgeAssets = [
	{
		asset: BridgeAsset.Usdc,
		minAmount: 1_000_000n,
		maxAmount: 1_000_000_000_000n,
	},
] as const satisfies readonly BridgeLimit[]

export const bridgeAssetsByAsset = Object.fromEntries(
	bridgeAssets.map((limit) => [limit.asset, limit]),
)

export const USDC_MIN_AMOUNT = bridgeAssetsByAsset[BridgeAsset.Usdc].minAmount
export const USDC_MAX_AMOUNT = bridgeAssetsByAsset[BridgeAsset.Usdc].maxAmount

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
