import {
	categorizeError,
	getRetryDelay,
	isRetryable,
	type BridgeError,
} from '$/lib/bridge/errors.ts'

export const withRetry = async <T>(
	fn: () => Promise<T>,
	options: {
		maxAttempts?: number
		shouldRetry?: (error: BridgeError) => boolean
		onError?: (error: BridgeError, attempt: number) => void
		getDelay?: (error: BridgeError, attempt: number) => number
	} = {},
): Promise<T> => {
	const {
		maxAttempts = 3,
		shouldRetry = isRetryable,
		onError,
		getDelay,
	} = options
	const delayMs = getDelay ?? getRetryDelay
	let lastError: BridgeError | null = null
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn()
		} catch (e) {
			lastError = categorizeError(e)
			onError?.(lastError, attempt)
			if (attempt < maxAttempts && shouldRetry(lastError)) {
				await new Promise((r) => setTimeout(r, delayMs(lastError, attempt)))
			} else {
				throw lastError
			}
		}
	}
	throw lastError
}
