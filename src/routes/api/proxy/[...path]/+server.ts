import { env as privateEnv } from '$env/dynamic/private'
import { PROXY_BACKEND_BASE_URLS } from '$/constants/proxy'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, url }) => {
	const path = params.path
	const segments = path.split('/').filter(Boolean)
	const backend = segments[0]
	const baseUrl = backend ? PROXY_BACKEND_BASE_URLS[backend] : undefined
	if (!baseUrl) {
		return new Response(null, { status: 404 })
	}
	const rest = segments.slice(1)
	const targetPath = rest.length > 0 ? `/${rest.join('/')}` : '/'
	const target = new URL(targetPath + url.search, baseUrl)
	const token = backend === 'stork' ? privateEnv.STORK_REST_TOKEN : undefined
	const response = await fetch(target.toString(), {
		headers: token
			? {
					Authorization: `Basic ${token}`,
				}
			: undefined,
	})
	const contentType = response.headers.get('content-type')
	const body = await response.arrayBuffer()
	return new Response(body, {
		status: response.status,
		statusText: response.statusText,
		headers: contentType
			? {
					'Content-Type': contentType,
				}
			: {},
	})
}
