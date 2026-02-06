import { describe, expect, it } from 'vitest'
import type { BridgeError } from './bridge-errors'
import { ErrorCode } from './bridge-errors'
import { withRetry } from './retry'

describe('withRetry', () => {
	it('returns result on success', async () => {
		const result = await withRetry(() => Promise.resolve(42))
		expect(result).toBe(42)
	})

	it('retries on retryable error and eventually succeeds', async () => {
		let attempts = 0
		const result = await withRetry(() => {
			attempts++
			if (attempts < 2) throw new Error('network error')
			return Promise.resolve(1)
		})
		expect(attempts).toBe(2)
		expect(result).toBe(1)
	})

	it('throws last categorized error after max attempts', async () => {
		let attempts = 0
		await expect(
			withRetry(
				() => {
					attempts++
					throw new Error('network error')
				},
				{ maxAttempts: 3, getDelay: () => 0 },
			),
		).rejects.toMatchObject({
			code: ErrorCode.Network,
			title: 'Network error',
			retryable: true,
		})
		expect(attempts).toBe(3)
	})

	it('does not retry on non-retryable error', async () => {
		let attempts = 0
		await expect(
			withRetry(
				() => {
					attempts++
					throw new Error('insufficient funds')
				},
				{ maxAttempts: 3 },
			),
		).rejects.toMatchObject({
			code: ErrorCode.InsufficientFunds,
			retryable: false,
		})
		expect(attempts).toBe(1)
	})

	it('calls onError on each failure', async () => {
		const errors: unknown[] = []
		await expect(
			withRetry(
				() => {
					throw new Error('network error')
				},
				{
					maxAttempts: 2,
					onError: (err) => {
						errors.push(err)
					},
				},
			),
		).rejects.toBeDefined()
		expect(errors).toHaveLength(2)
		expect(
			errors.every((e) => (e as BridgeError).code === ErrorCode.Network),
		).toBe(true)
	})
})
