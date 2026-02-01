import { describe, expect, it } from 'vitest'
import { encodeNitroRpc, decodeNitroRpc, hashChannelState } from './nitro-rpc'

describe('nitro-rpc', () => {
	describe('encodeNitroRpc', () => {
		it('returns JSON array with requestId, method, params, timestamp', () => {
			const out = encodeNitroRpc(1, 'ping', {})
			const parsed = JSON.parse(out) as unknown[]
			expect(parsed[0]).toBe(1)
			expect(parsed[1]).toBe('ping')
			expect(parsed[2]).toEqual({})
			expect(typeof parsed[3]).toBe('number')
		})
	})

	describe('decodeNitroRpc', () => {
		it('parses encoded message back to tuple', () => {
			const msg = [2, 'channel_updated', { id: 'ch1' }, 12345] as const
			const encoded = JSON.stringify(msg)
			expect(decodeNitroRpc(encoded)).toEqual([2, 'channel_updated', { id: 'ch1' }, 12345])
		})
	})

	describe('hashChannelState', () => {
		it('joins channelId, turnNum, balances, appData with |', () => {
			expect(hashChannelState({
				channelId: 'ch1',
				turnNum: 3,
				balance0: 100n,
				balance1: 50n,
				appData: '0x',
			})).toBe('ch1|3|100|50|0x')
		})
	})
})
