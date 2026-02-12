/**
 * USDC bridge amount limits. Amounts in smallest units (6 decimals).
 * Validation helpers in lib/bridge-limits.ts.
 */

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
