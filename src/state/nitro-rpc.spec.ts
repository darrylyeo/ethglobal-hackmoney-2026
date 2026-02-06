import { describe, expect, it } from 'vitest'
import { encodeNitroRpc, decodeNitroRpc, hashChannelState } from './nitro-rpc.ts'

describe('nitro-rpc', () => {
	describe('encodeNitroRpc', () => {
		it('returns JSON envelope with req payload', () => {
			const out = encodeNitroRpc(1, 'ping', {})
			const parsed = JSON.parse(out) as { req: unknown[] }
			expect(parsed.req[0]).toBe(1)
			expect(parsed.req[1]).toBe('ping')
			expect(parsed.req[2]).toEqual({})
			expect(typeof parsed.req[3]).toBe('number')
		})
	})

	describe('decodeNitroRpc', () => {
		it('parses encoded payload arrays', () => {
			const msg = [2, 'channel_updated', { id: 'ch1' }, 12345] as const
			const encoded = JSON.stringify(msg)
			expect(decodeNitroRpc(encoded)).toEqual([
				2,
				'channel_updated',
				{ id: 'ch1' },
				12345,
			])
		})

		it('parses encoded envelopes', () => {
			const msg = { res: [3, 'tr', { id: 'tx1' }, 54321] }
			const encoded = JSON.stringify(msg)
			expect(decodeNitroRpc(encoded)).toEqual([3, 'tr', { id: 'tx1' }, 54321])
		})
	})

	describe('hashChannelState', () => {
		it('serializes packed state payload', () => {
			expect(
				hashChannelState({
					channelId: '0x1111111111111111111111111111111111111111',
					intent: 1,
					version: 3,
					stateData: '0x',
					allocations: [
						{
							destination: '0x2222222222222222222222222222222222222222',
							token: '0x3333333333333333333333333333333333333333',
							amount: 100n,
						},
					],
				}),
			).toBe(
				JSON.stringify([
					'0x1111111111111111111111111111111111111111',
					1,
					3,
					'0x',
					[
						{
							destination: '0x2222222222222222222222222222222222222222',
							token: '0x3333333333333333333333333333333333333333',
							amount: '100',
						},
					],
				]),
			)
		})
	})
})
