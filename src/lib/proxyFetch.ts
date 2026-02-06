/**
 * Client-side fetch via the sitewhite proxy (hooks.server.ts) when the target
 * does not support CORS. Use for REST calls that would otherwise be blocked.
 */

import { getProxyOrigin, getProxyTarget } from '$/constants/proxy'

export const proxyFetch = (
	targetId: string,
	path: string,
	init?: RequestInit,
): Promise<Response> => {
	const base = getProxyOrigin(targetId)
	if (!base) {
		const target = getProxyTarget(targetId)
		throw new Error(
			target
				? 'proxyFetch is only available in the browser'
				: `Unknown proxy target: ${targetId}`,
		)
	}
	const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
	return fetch(url, init)
}
