import { storkRestBaseUrl } from '$/constants/stork'

export const PROXY_ALLOWED_ORIGINS = new Set<string>([
	'http://localhost:5000',
	'http://localhost:5173',
	'http://127.0.0.1:5000',
	'http://127.0.0.1:5173',
])

export const PROXY_API_PREFIX = '/api/proxy'

export type ProxyTarget = {
	id: string
	origin: string
	tokenEnvKey?: string
}

export const PROXY_TARGETS: ProxyTarget[] = [
	{
		id: 'stork',
		origin: storkRestBaseUrl,
		tokenEnvKey: 'STORK_REST_TOKEN',
	},
]

const proxyTargetById = new Map(PROXY_TARGETS.map((t) => [t.id, t]))

export const getProxyTarget = (id: string) => proxyTargetById.get(id)

export const getProxyOrigin = (id: string) => {
	if (typeof window === 'undefined') return null
	return `${window.location.origin}${PROXY_API_PREFIX}/${id}`
}
