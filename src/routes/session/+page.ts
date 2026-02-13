import type { PageLoad } from './$types.ts'
import { getSessionInputFromUrl } from '$/lib/session/sessionUrl.ts'

export const load: PageLoad = ({ url }) => ({
	...getSessionInputFromUrl(url),
	urlKey: url.search,
})
