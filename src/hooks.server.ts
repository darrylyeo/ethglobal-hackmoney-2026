import { type Handle, error } from '@sveltejs/kit'

const PROXY_PATH = '/api-proxy/'

const allowedOrigins = [
	'https://rest.jp.stork-oracle.network',
	'https://opencode.ai',
]

export const handle: Handle = async ({
	event,
	resolve
}) => {
	if(!event.url.pathname.startsWith(PROXY_PATH))
		return await resolve(event)

	const url = new URL(
		decodeURIComponent(event.url.pathname.replace(PROXY_PATH, ''))
		+ event.url.search,
	)

	if(!(
		allowedOrigins
			.includes(url.origin)
	))
		throw error(403, 'Request Forbidden.')

	try {
		return await event.fetch(
			url,
			{
				...event.request,
				headers: new Headers({
					'Authorization': event.request.headers.get('Authorization'),
				}),
			}
		)
	} catch (err) {
		throw error(502, err instanceof Error ? err.message : 'Proxy upstream error')
	}
}
