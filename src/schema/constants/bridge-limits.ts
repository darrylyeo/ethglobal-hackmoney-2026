import type { AmountValidationError, BridgeAsset } from '$/constants/bridge-limits'

export type BridgeLimit = {
	asset: BridgeAsset
	minAmount: bigint
	maxAmount: bigint
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
