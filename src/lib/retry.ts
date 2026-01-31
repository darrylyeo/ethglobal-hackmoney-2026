import {
	categorizeError,
	getRetryDelay,
	isRetryable,
	type BridgeError,
} from '$/lib/errors'

export const withRetry = async <T>(
	fn: () => Promise<T>,
	options: {
		maxAttempts?: number
		shouldRetry?: (error: BridgeError) => boolean
		onError?: (error: BridgeError, attempt: number) => void
	} = {},
): Promise<T> => {
	const { maxAttempts = 3, shouldRetry = isRetryable, onError } = options
	let lastError: BridgeError | null = null
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn()
		} catch (e) {
			lastError = categorizeError(e)
			onError?.(lastError, attempt)
			if (attempt < maxAttempts && shouldRetry(lastError)) {
				const delay = getRetryDelay(lastError, attempt)
				await new Promise((r) => setTimeout(r, delay))
			} else {
				throw lastError
			}
		}
	}
	throw lastError
}
