import { type Handle, error, json } from '@sveltejs/kit'

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
	
	const url = new URL(event.url.pathname.replace(PROXY_PATH, ''))

	if(!(
		allowedOrigins
			.includes(url.origin)
	))
		throw error(403, 'Request Forbidden.')

	return (
		json(
			await event.fetch(
				url,
				{
					...event.request,
					headers: new Headers({
						'Authorization': event.request.headers.get('Authorization')
					})
				}
			)
				.then(response => response.json())
		)
	)
}
