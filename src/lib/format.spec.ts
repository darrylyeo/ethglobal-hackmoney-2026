import { describe, expect, it } from 'vitest'
import {
	parseDecimalToSmallest,
	formatSmallestToDecimal,
	isValidDecimalInput,
	formatTokenAmount,
} from './format.ts'

describe('parseDecimalToSmallest', () => {
	it('returns 0n for empty string', () => {
		expect(parseDecimalToSmallest('', 6)).toBe(0n)
	})

	it('handles whole numbers', () => {
		expect(parseDecimalToSmallest('100', 6)).toBe(100_000_000n)
	})

	it('handles decimals', () => {
		expect(parseDecimalToSmallest('100.5', 6)).toBe(100_500_000n)
		expect(parseDecimalToSmallest('0.000001', 6)).toBe(1n)
	})

	it('handles commas', () => {
		expect(parseDecimalToSmallest('1,000.50', 6)).toBe(1_000_500_000n)
	})

	it('truncates extra decimals', () => {
		expect(parseDecimalToSmallest('1.1234567', 6)).toBe(1_123_456n)
	})
})

describe('formatSmallestToDecimal', () => {
	it('formats correctly', () => {
		expect(formatSmallestToDecimal(100_500_000n, 6)).toBe('100.5')
		expect(formatSmallestToDecimal(1n, 6)).toBe('0.000001')
		expect(formatSmallestToDecimal(0n, 6)).toBe('0')
	})

	it('respects maxFractionDigits', () => {
		expect(formatSmallestToDecimal(100_123_456n, 6, 4)).toBe('100.1234')
	})
})

describe('isValidDecimalInput', () => {
	it('validates correctly', () => {
		expect(isValidDecimalInput('100.50', 6)).toBe(true)
		expect(isValidDecimalInput('100.1234567', 6)).toBe(false)
		expect(isValidDecimalInput('abc', 6)).toBe(false)
		expect(isValidDecimalInput('100.123456', 6)).toBe(true)
	})
})

describe('formatTokenAmount', () => {
	it('formats amount with decimals', () => {
		expect(formatTokenAmount('100500000', 6)).toBe('100.5')
	})
})
