import type { Handle } from '@sveltejs/kit'
import { PROXY_ALLOWED_ORIGINS, PROXY_API_PREFIX } from '$/constants/proxy'

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith(PROXY_API_PREFIX)) {
		const origin = event.request.headers.get('origin')
		if (origin != null && !PROXY_ALLOWED_ORIGINS.has(origin)) {
			return new Response(null, { status: 403 })
		}
	}
	return resolve(event)
}
