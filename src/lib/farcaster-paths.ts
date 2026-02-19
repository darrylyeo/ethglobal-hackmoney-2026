/**
 * Farcaster path and anchor helpers. Mirrors network-paths pattern.
 */

import { castUrl } from '$/constants/farcaster.ts'

export const castAnchorId = (fid: number, hash: `0x${string}`) =>
	`cast:${fid}:${hash}`

export const getCastUrl = (fid: number, hash: `0x${string}`) => castUrl(fid, hash)

/** Extract channel id from parentUrl (e.g. https://warpcast.com/~/channel/base → base). */
export const channelIdFromParentUrl = (parentUrl?: string): string | null =>
	parentUrl ? (parentUrl.split('/').filter(Boolean).pop() ?? null) : null

/** Show-context link: for reply → parent cast page#anchor; for root → channel or user page#anchor. */
export const getCastContextPath = (
	cast: {
		$id: { fid: number; hash: `0x${string}` }
		parentFid?: number
		parentHash?: `0x${string}`
		parentUrl?: string
	},
): { href: string } | null => {
	const anchor = `#${castAnchorId(cast.$id.fid, cast.$id.hash)}`
	if (cast.parentFid != null && cast.parentHash) {
		return { href: getCastUrl(cast.parentFid, cast.parentHash) + anchor }
	}
	const chId = channelIdFromParentUrl(cast.parentUrl)
	if (chId) {
		return { href: `/farcaster/channel/${encodeURIComponent(chId)}${anchor}` }
	}
	return { href: `/farcaster/user/${cast.$id.fid}${anchor}` }
}
