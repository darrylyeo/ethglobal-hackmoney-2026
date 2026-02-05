import { env as privateEnv } from '$env/dynamic/private'
import { getProxyTarget } from '$/constants/proxy'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, url }) => {
	const segments = params.path.split('/').filter(Boolean)
	const targetId = segments[0]
	const target = targetId ? getProxyTarget(targetId) : undefined
	if (!target) {
		return new Response(null, { status: 404 })
	}
	const path = segments.length > 1 ? `/${segments.slice(1).join('/')}` : '/'
	const targetUrl = new URL(path + url.search, target.origin)
	const token = target.tokenEnvKey
		? (privateEnv[target.tokenEnvKey] as string | undefined)
		: undefined
	const response = await fetch(targetUrl.toString(), {
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
