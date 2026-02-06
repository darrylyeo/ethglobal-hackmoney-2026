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
		expect(e.code).toBe(ErrorCode.UserRejected)
		expect(e.title).toBe('Transaction cancelled')
		expect(e.retryable).toBe(true)
	})

	it('maps insufficient funds to INSUFFICIENT_FUNDS, not retryable', () => {
		const e = categorizeError(new Error('insufficient funds for transfer'))
		expect(e.code).toBe(ErrorCode.InsufficientFunds)
		expect(e.retryable).toBe(false)
	})

	it('maps no routes to NO_ROUTES with retryable and suggestion', () => {
		const e = categorizeError(new Error('no routes available'))
		expect(e.code).toBe(ErrorCode.NoRoutes)
		expect(e.retryable).toBe(true)
		expect(e.suggestion).toContain('chain pair')
	})

	it('maps network error to NETWORK, retryable', () => {
		const e = categorizeError(new Error('Network request failed'))
		expect(e.code).toBe(ErrorCode.Network)
		expect(e.retryable).toBe(true)
	})

	it('maps rate limit to RATE_LIMITED with 30s retry delay', () => {
		const e = categorizeError(new Error('429 Too Many Requests'))
		expect(e.code).toBe(ErrorCode.RateLimited)
		expect(e.retryable).toBe(true)
		expect(e.retryDelay).toBe(30_000)
	})

	it('maps quote expired to QUOTE_EXPIRED, retryable', () => {
		const e = categorizeError(new Error('Quote expired'))
		expect(e.code).toBe(ErrorCode.QuoteExpired)
		expect(e.retryable).toBe(true)
	})

	it('maps slippage to SLIPPAGE_EXCEEDED, retryable with suggestion', () => {
		const e = categorizeError(new Error('Slippage tolerance exceeded'))
		expect(e.code).toBe(ErrorCode.SlippageExceeded)
		expect(e.retryable).toBe(true)
		expect(e.suggestion).toContain('slippage')
	})

	it('maps unknown to UNKNOWN with generic message, retryable', () => {
		const e = categorizeError(new Error('Some random error xyz'))
		expect(e.code).toBe(ErrorCode.Unknown)
		expect(e.title).toBe('Something went wrong')
		expect(e.retryable).toBe(true)
	})

	it('maps 15+ error patterns', () => {
		const cases: [string, ErrorCode][] = [
			['user rejected', ErrorCode.UserRejected],
			['insufficient funds', ErrorCode.InsufficientFunds],
			['insufficient gas', ErrorCode.InsufficientGas],
			['no routes', ErrorCode.NoRoutes],
			['quote expired', ErrorCode.QuoteExpired],
			['slippage exceeded', ErrorCode.SlippageExceeded],
			['rate limit', ErrorCode.RateLimited],
			['network error', ErrorCode.Network],
			['RPC call exception', ErrorCode.RpcError],
			['chain not supported', ErrorCode.ChainNotSupported],
			['wrong chain', ErrorCode.WrongChain],
			['execution reverted', ErrorCode.ExecutionReverted],
			['amount too low', ErrorCode.AmountTooLow],
			['amount too high', ErrorCode.AmountTooHigh],
			['approval failed', ErrorCode.ApprovalFailed],
			['wallet disconnected', ErrorCode.WalletDisconnected],
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
				code: ErrorCode.Unknown,
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
		expect(
			isRetryable({ retryable: true } as Parameters<typeof isRetryable>[0]),
		).toBe(true)
		expect(
			isRetryable({ retryable: false } as Parameters<typeof isRetryable>[0]),
		).toBe(false)
	})
})

describe('getRetryDelay', () => {
	it('uses error.retryDelay when set', () => {
		const e = { retryDelay: 30_000, retryable: true } as Parameters<
			typeof getRetryDelay
		>[0]
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
