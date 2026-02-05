import { storkRestBaseUrl } from '$/constants/stork'

export const PROXY_ALLOWED_ORIGINS = new Set<string>([
	'http://localhost:5000',
	'http://localhost:5173',
	'http://127.0.0.1:5000',
	'http://127.0.0.1:5173',
])

export const PROXY_API_PREFIX = '/api/proxy'

export const PROXY_BACKEND_BASE_URLS: Record<string, string> = {
	stork: storkRestBaseUrl,
}
