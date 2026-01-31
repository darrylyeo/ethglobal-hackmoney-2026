import { describe, expect, it } from 'vitest'
import {
	formatSlippagePercent,
	parseSlippagePercent,
	calculateMinOutput,
	SLIPPAGE_PRESETS,
	DEFAULT_SLIPPAGE,
	MIN_SLIPPAGE,
	MAX_SLIPPAGE,
} from './slippage'

describe('formatSlippagePercent', () => {
	it('formats 0.005 as 0.5%', () => {
		expect(formatSlippagePercent(0.005)).toBe('0.5%')
	})
	it('formats 0.01 as 1%', () => {
		expect(formatSlippagePercent(0.01)).toBe('1%')
	})
	it('formats 0.001 as 0.1%', () => {
		expect(formatSlippagePercent(0.001)).toBe('0.1%')
	})
})

describe('parseSlippagePercent', () => {
	it('parses "1%" to 0.01', () => {
		expect(parseSlippagePercent('1%')).toBe(0.01)
	})
	it('parses "0.5" to 0.005', () => {
		expect(parseSlippagePercent('0.5')).toBe(0.005)
	})
	it('returns null for below min (0.001%)', () => {
		expect(parseSlippagePercent('0.001%')).toBe(null)
	})
	it('returns null for invalid', () => {
		expect(parseSlippagePercent('')).toBe(null)
		expect(parseSlippagePercent('abc')).toBe(null)
	})
})

describe('calculateMinOutput', () => {
	it('returns 995000n for 1000000n and 0.005 slippage', () => {
		expect(calculateMinOutput(1_000_000n, 0.005)).toBe(995_000n)
	})
})

describe('constants', () => {
	it('presets are 0.1%, 0.5%, 1%', () => {
		expect(SLIPPAGE_PRESETS).toEqual([0.001, 0.005, 0.01])
	})
	it('default is 0.5%', () => {
		expect(DEFAULT_SLIPPAGE).toBe(0.005)
	})
	it('min/max in range', () => {
		expect(MIN_SLIPPAGE).toBe(0.0001)
		expect(MAX_SLIPPAGE).toBe(0.5)
	})
})
