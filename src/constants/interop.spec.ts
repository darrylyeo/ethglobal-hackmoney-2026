import { describe, expect, it } from 'vitest'
import {
	toInteropAddressText,
	toInteropName,
	toInteropHex,
	fromInteropBinary,
} from './interop'

describe('toInteropAddressText', () => {
	it('returns eip155 text representation for chainId and address', () => {
		const out = toInteropAddressText(
			1,
			'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
		)
		expect(out.version).toBe(1)
		expect(out.chainType).toBe('eip155')
		expect(out.chainReference).toBe('1')
		expect(out.address).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
	})
})

describe('toInteropName', () => {
	it('formats Actor-like (chain + address) to interoperable name with checksum', () => {
		const name = toInteropName(1, '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
		expect(name).toMatch(/^0x[a-fA-F0-9]{40}@eip155:1#[\dA-F]{8}$/)
	})

	it('formats TokenListCoin-like (chain + token address) to interoperable name', () => {
		const name = toInteropName(
			8453,
			'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
		)
		expect(name).toMatch(/^0x[a-fA-F0-9]{40}@eip155:8453#[\dA-F]{8}$/)
	})
})

describe('toInteropHex', () => {
	it('encodes to hex string', () => {
		const hex = toInteropHex(1, '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
		expect(hex).toMatch(/^0x[a-fA-F0-9]+$/)
		expect(hex.length).toBeGreaterThan(42)
	})
})

describe('fromInteropBinary', () => {
	it('decodes hex back to text representation', () => {
		const hex = toInteropHex(1, '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
		const decoded = fromInteropBinary(hex)
		expect(decoded.chainType).toBe('eip155')
		expect(decoded.chainReference).toBe('1')
		expect(decoded.address?.toLowerCase()).toBe(
			'0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
		)
	})
})
