import { stringify } from 'devalue'

const wrapperByFn = new WeakMap<
	(...args: unknown[]) => Promise<unknown>,
	(...args: unknown[]) => Promise<unknown>
>()

/**
 * Single-flight wrapper: concurrent calls with the same (devalue-stringified) args
 * share one promise until it settles. Wrappers cached by fn so inline singleFlight(fn)(...args).
 */
export const singleFlight = <A extends unknown[], R>(
	fn: (...args: A) => Promise<R>,
): ((...args: A) => Promise<R>) => {
	const cached = wrapperByFn.get(fn as (...args: unknown[]) => Promise<unknown>)
	if (cached) return cached as (...args: A) => Promise<R>
	const inFlight = new Map<string, Promise<R>>()
	const wrapped = (...args: A) => {
		const key = stringify(args)
		const existing = inFlight.get(key)
		if (existing) return existing
		const p = fn(...args).finally(() => {
			inFlight.delete(key)
		})
		inFlight.set(key, p)
		return p
	}
	wrapperByFn.set(fn as (...args: unknown[]) => Promise<unknown>, wrapped as (...args: unknown[]) => Promise<unknown>)
	return wrapped
}
