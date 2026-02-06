import { storkRestBaseUrl } from '$/constants/stork'

export type ProxyTarget = {
	id: string
	origin: string
	tokenEnvKey?: string
}

export const PROXY_PATH_PREFIX = '/api-proxy/'

const OPENCODE_ZEN_ORIGIN = 'https://opencode.ai'

export const PROXY_TARGETS: ProxyTarget[] = [
	{
		id: 'stork',
		origin: storkRestBaseUrl,
		tokenEnvKey: 'STORK_REST_TOKEN',
	},
	{
		id: 'opencode',
		origin: OPENCODE_ZEN_ORIGIN,
	},
]

const proxyTargetById = new Map(PROXY_TARGETS.map((t) => [t.id, t]))

export const getProxyTarget = (id: string) => proxyTargetById.get(id)

export const getProxyOrigin = (id: string) => {
	if (typeof window === 'undefined') return null
	const target = getProxyTarget(id)
	return target
		? `${window.location.origin}${PROXY_PATH_PREFIX}${target.origin}`
		: null
}
