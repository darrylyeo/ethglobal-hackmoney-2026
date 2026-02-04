import { describe, expect, it } from 'vitest'
import { getTxUrl, getAddressUrl } from './explorers'

describe('explorers', () => {
	describe('getTxUrl', () => {
		it('returns Etherscan URL for chain 1', () => {
			expect(getTxUrl(1, '0xabc')).toBe('https://etherscan.io/tx/0xabc')
		})

		it('returns Optimistic Etherscan URL for chain 10', () => {
			expect(getTxUrl(10, '0xabc')).toBe(
				'https://optimistic.etherscan.io/tx/0xabc',
			)
		})

		it('returns Blockscan fallback for unknown chain', () => {
			expect(getTxUrl(999999, '0xabc')).toBe('https://blockscan.com/tx/0xabc')
		})
	})

	describe('getAddressUrl', () => {
		it('returns Etherscan address URL for chain 1', () => {
			expect(getAddressUrl(1, '0x123')).toBe(
				'https://etherscan.io/address/0x123',
			)
		})

		it('returns Blockscan fallback for unknown chain', () => {
			expect(getAddressUrl(999999, '0x123')).toBe(
				'https://blockscan.com/address/0x123',
			)
		})
	})
})
