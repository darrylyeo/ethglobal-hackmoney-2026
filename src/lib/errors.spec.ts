import { describe, expect, it } from 'vitest'
import {
	ErrorCode,
	categorizeError,
	getRetryDelay,
	isBridgeError,
	isRetryable,
} from './errors'

describe('categorizeError', () => {
	it('maps user rejection to USER_REJECTED with "Transaction cancelled"', () => {
		const e = categorizeError(new Error('User rejected the request'))
		expect(e.code).toBe(ErrorCode.USER_REJECTED)
		expect(e.title).toBe('Transaction cancelled')
		expect(e.retryable).toBe(true)
	})

	it('maps insufficient funds to INSUFFICIENT_FUNDS, not retryable', () => {
		const e = categorizeError(new Error('insufficient funds for transfer'))
		expect(e.code).toBe(ErrorCode.INSUFFICIENT_FUNDS)
		expect(e.retryable).toBe(false)
	})

	it('maps no routes to NO_ROUTES with retryable and suggestion', () => {
		const e = categorizeError(new Error('no routes available'))
		expect(e.code).toBe(ErrorCode.NO_ROUTES)
		expect(e.retryable).toBe(true)
		expect(e.suggestion).toContain('chain pair')
	})

	it('maps network error to NETWORK, retryable', () => {
		const e = categorizeError(new Error('Network request failed'))
		expect(e.code).toBe(ErrorCode.NETWORK)
		expect(e.retryable).toBe(true)
	})

	it('maps rate limit to RATE_LIMITED with 30s retry delay', () => {
		const e = categorizeError(new Error('429 Too Many Requests'))
		expect(e.code).toBe(ErrorCode.RATE_LIMITED)
		expect(e.retryable).toBe(true)
		expect(e.retryDelay).toBe(30_000)
	})

	it('maps quote expired to QUOTE_EXPIRED, retryable', () => {
		const e = categorizeError(new Error('Quote expired'))
		expect(e.code).toBe(ErrorCode.QUOTE_EXPIRED)
		expect(e.retryable).toBe(true)
	})

	it('maps slippage to SLIPPAGE_EXCEEDED, retryable with suggestion', () => {
		const e = categorizeError(new Error('Slippage tolerance exceeded'))
		expect(e.code).toBe(ErrorCode.SLIPPAGE_EXCEEDED)
		expect(e.retryable).toBe(true)
		expect(e.suggestion).toContain('slippage')
	})

	it('maps unknown to UNKNOWN with generic message, retryable', () => {
		const e = categorizeError(new Error('Some random error xyz'))
		expect(e.code).toBe(ErrorCode.UNKNOWN)
		expect(e.title).toBe('Something went wrong')
		expect(e.retryable).toBe(true)
	})

	it('maps 15+ error patterns', () => {
		const cases: [string, ErrorCode][] = [
			['user rejected', ErrorCode.USER_REJECTED],
			['insufficient funds', ErrorCode.INSUFFICIENT_FUNDS],
			['insufficient gas', ErrorCode.INSUFFICIENT_GAS],
			['no routes', ErrorCode.NO_ROUTES],
			['quote expired', ErrorCode.QUOTE_EXPIRED],
			['slippage exceeded', ErrorCode.SLIPPAGE_EXCEEDED],
			['rate limit', ErrorCode.RATE_LIMITED],
			['network error', ErrorCode.NETWORK],
			['RPC call exception', ErrorCode.RPC_ERROR],
			['chain not supported', ErrorCode.CHAIN_NOT_SUPPORTED],
			['wrong chain', ErrorCode.WRONG_CHAIN],
			['execution reverted', ErrorCode.EXECUTION_REVERTED],
			['amount too low', ErrorCode.AMOUNT_TOO_LOW],
			['amount too high', ErrorCode.AMOUNT_TOO_HIGH],
			['approval failed', ErrorCode.APPROVAL_FAILED],
			['wallet disconnected', ErrorCode.WALLET_DISCONNECTED],
		]
		expect(cases.length).toBeGreaterThanOrEqual(15)
		for (const [msg, code] of cases) {
			expect(categorizeError(new Error(msg)).code).toBe(code)
		}
	})

	it('preserves originalError when given Error', () => {
		const orig = new Error('user rejected')
		const e = categorizeError(orig)
		expect(e.originalError).toBe(orig)
	})
})

describe('isBridgeError', () => {
	it('returns true for BridgeError-shaped object', () => {
		expect(
			isBridgeError({
				code: ErrorCode.UNKNOWN,
				title: 'x',
				message: 'y',
				suggestion: 'z',
				retryable: true,
			}),
		).toBe(true)
	})
	it('returns false for Error', () => {
		expect(isBridgeError(new Error('x'))).toBe(false)
	})
	it('returns false for null', () => {
		expect(isBridgeError(null)).toBe(false)
	})
})

describe('isRetryable', () => {
	it('returns error.retryable', () => {
		expect(isRetryable({ retryable: true } as Parameters<typeof isRetryable>[0])).toBe(true)
		expect(isRetryable({ retryable: false } as Parameters<typeof isRetryable>[0])).toBe(false)
	})
})

describe('getRetryDelay', () => {
	it('uses error.retryDelay when set', () => {
		const e = { retryDelay: 30_000, retryable: true } as Parameters<typeof getRetryDelay>[0]
		expect(getRetryDelay(e, 1)).toBe(30_000)
	})
	it('applies exponential backoff', () => {
		const e = { retryable: true } as Parameters<typeof getRetryDelay>[0]
		expect(getRetryDelay(e, 1)).toBe(1000)
		expect(getRetryDelay(e, 2)).toBe(2000)
		expect(getRetryDelay(e, 3)).toBe(4000)
	})
	it('caps at 30s', () => {
		const e = { retryable: true } as Parameters<typeof getRetryDelay>[0]
		expect(getRetryDelay(e, 10)).toBe(30_000)
	})
})
