import { describe, expect, it } from 'vitest'
import {
	validateBridgeAmount,
	extractRouteLimits,
	USDC_MIN_AMOUNT,
	USDC_MAX_AMOUNT,
} from './bridge-limits.ts'

describe('validateBridgeAmount', () => {
	it('returns valid for amounts in range', () => {
		expect(validateBridgeAmount(1_000_000n).isValid).toBe(true)
		expect(validateBridgeAmount(100_000_000n).isValid).toBe(true)
		expect(validateBridgeAmount(USDC_MAX_AMOUNT).isValid).toBe(true)
	})

	it('returns too_low error with min amount for small amounts', () => {
		const r = validateBridgeAmount(999_999n)
		expect(r.isValid).toBe(false)
		expect(r.error).toBe('too_low')
		expect(r.minAmount).toBe('1')
	})

	it('returns too_high error with max amount for large amounts', () => {
		const r = validateBridgeAmount(USDC_MAX_AMOUNT + 1n)
		expect(r.isValid).toBe(false)
		expect(r.error).toBe('too_high')
		expect(r.maxAmount).toBe('1000000')
	})

	it('invalidates zero and negative amounts', () => {
		expect(validateBridgeAmount(0n)).toEqual({
			isValid: false,
			error: 'invalid',
		})
		expect(validateBridgeAmount(-1n)).toEqual({
			isValid: false,
			error: 'invalid',
		})
	})
})

describe('extractRouteLimits', () => {
	it('returns null limits for empty routes', () => {
		expect(extractRouteLimits([])).toEqual({
			minAmount: null,
			maxAmount: null,
		})
	})

	it('returns min/max from route fromAmounts', () => {
		expect(
			extractRouteLimits([
				{ fromAmount: 100_000_000n },
				{ fromAmount: 50_000_000n },
				{ fromAmount: 200_000_000n },
			]),
		).toEqual({
			minAmount: 50_000_000n,
			maxAmount: 200_000_000n,
		})
	})
})
