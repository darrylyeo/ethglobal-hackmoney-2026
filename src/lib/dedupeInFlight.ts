/**
 * Deduplicate in-flight async operations by key. Concurrent callers with the same
 * key share the same promise until it settles.
 */
const inFlight = new Map<string, Promise<unknown>>()

export const dedupeInFlight = <T>(key: string, fn: () => Promise<T>,) => {
	const existing = inFlight.get(key)
	if (existing) return existing as Promise<T>
	const p = fn().finally(() => {
		inFlight.delete(key)
	})
	inFlight.set(key, p)
	return p
}
