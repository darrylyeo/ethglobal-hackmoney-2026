import type { PageLoad } from './$types.ts'
import { SocialProtocol } from '$/constants/social-post-actions.ts'
import { getSocialPostSessionInputFromUrl } from '$/lib/session/socialPostSessionUrl.ts'

export const load: PageLoad = ({ url }) => ({
	...getSocialPostSessionInputFromUrl(url, SocialProtocol.Farcaster, 0),
	urlKey: url.search,
})
