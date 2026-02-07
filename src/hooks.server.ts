import { env as privateEnv } from '$env/dynamic/private'
import { PROXY_TARGETS } from '$/constants/proxy.ts'
import { type Handle, error, json } from '@sveltejs/kit'

const PROXY_PATH = '/api-proxy/'

const PROXY_ALLOWED_ORIGINS = new Set(
	PROXY_TARGETS.map((t) => t.origin),
)

const proxyTargetByOrigin = new Map(
	PROXY_TARGETS.map((t) => [t.origin, t]),
)

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith(PROXY_PATH)) {
		const url = new URL(`${event.url.pathname.replace(PROXY_PATH, '')}${event.url.search}`)

		if (!PROXY_ALLOWED_ORIGINS.has(url.origin))
			error(403, 'Request Forbidden.')

		const target = proxyTargetByOrigin.get(url.origin)
		const token = target?.tokenEnvKey
			? (privateEnv[target.tokenEnvKey] as string | undefined)
			: undefined

		let response: Response
		try {
			response = await event.fetch(url, {
				body: event.request.body,
				method: event.request.method,
				headers: token
					? {
							Authorization: `Basic ${token}`,
						}
					: undefined,
			})
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Upstream request failed'
			return error(502, { message })
		}

		if (!response.ok) {
			const result = await response.text()

			try {
				return error(response.status, JSON.parse(result))
			} catch {
				return error(response.status, result)
			}
		}

		return json(await response.json())
	}

	return await resolve(event)
}

