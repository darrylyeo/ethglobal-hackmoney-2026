import { describe, expect, it } from 'vitest'
import {
	checksumAddress,
	formatAddress,
	isValidAddress,
	normalizeAddress,
	parseAccountAddressParam,
} from './address.ts'

describe('isValidAddress', () => {
	it('returns true for valid 40-char hex with 0x', () => {
		expect(isValidAddress('0x' + 'a'.repeat(40))).toBe(true)
		expect(isValidAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(
			true,
		)
	})
	it('returns false for too short', () => {
		expect(isValidAddress('0x123')).toBe(false)
		expect(isValidAddress('0x' + 'a'.repeat(39))).toBe(false)
	})
	it('returns false for non-hex', () => {
		expect(isValidAddress('0x' + 'g'.repeat(40))).toBe(false)
	})
	it('returns false for missing 0x', () => {
		expect(isValidAddress('d8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(
			false,
		)
	})
})

describe('normalizeAddress', () => {
	it('lowercases valid address', () => {
		expect(normalizeAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(
			'0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
		)
	})
	it('returns null for invalid', () => {
		expect(normalizeAddress('0x123')).toBe(null)
		expect(normalizeAddress('')).toBe(null)
	})
})

describe('checksumAddress', () => {
	it('returns EIP-55 checksummed address', () => {
		const addr = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
		const out = checksumAddress(addr)
		expect(out).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
	})
	it('returns null for invalid', () => {
		expect(checksumAddress('0x123')).toBe(null)
	})
})

describe('formatAddress', () => {
	it('truncates with ellipsis (default 6 chars)', () => {
		const addr = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
		expect(formatAddress(addr)).toBe('0xd8dA6B…A96045')
	})
	it('respects chars argument', () => {
		const addr = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
		expect(formatAddress(addr, 4)).toBe('0xd8dA…6045')
	})
})

describe('parseAccountAddressParam', () => {
	it('parses raw 0x address', () => {
		const out = parseAccountAddressParam(
			'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
		)
		expect(out).not.toBeNull()
		expect(out?.address).toBe('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
		expect(out?.interopAddress).toBeUndefined()
		expect(out?.chainId).toBeUndefined()
	})
	it('parses interop name (address@eip155:chain#checksum)', () => {
		const param = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045@eip155:1#ABCD1234'
		const out = parseAccountAddressParam(param)
		expect(out).not.toBeNull()
		expect(out?.address).toBe('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
		expect(out?.interopAddress).toBe(param)
		expect(out?.chainId).toBe(1)
	})
	it('returns null for invalid input', () => {
		expect(parseAccountAddressParam('not-an-address')).toBeNull()
		expect(parseAccountAddressParam('')).toBeNull()
	})
})
