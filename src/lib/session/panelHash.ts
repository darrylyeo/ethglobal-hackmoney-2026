import { replaceState } from '$app/navigation'

export const SESSION_HASH_SOURCE_KEY = Symbol('session-hash-source')

export type SessionHashSource = {
	enabled: boolean
	panelHash: string | null
	setPanelHash: (hash: string, replace?: boolean) => void
	setPanelRoute?: (path: string, params: Record<string, string>) => void
}

export const getEffectiveHash = (
	source: SessionHashSource | undefined,
	urlHash?: string,
): string =>
	source?.enabled
		? (source.panelHash ?? '')
		: urlHash !== undefined
			? urlHash
			: typeof window !== 'undefined'
				? window.location.hash
				: ''

export const setEffectiveHash = (
	source: SessionHashSource | undefined,
	hash: string,
	replace = true,
) => {
	if (source?.enabled) {
		source.setPanelHash(hash, replace)
		return
	}
	if (typeof window === 'undefined') return
	const nextUrl = `${window.location.pathname}${window.location.search}${hash}`
	replaceState(nextUrl, { hash })
}
