/**
 * Neynar REST API (api.neynar.com).
 * Provider-specific. Requires PUBLIC_NEYNAR_API_KEY. Extras not in Hub protocol (e.g. cast lookup by hash only).
 */

import { FARCASTER_NEYNAR_API_URL } from '$/constants/farcaster.ts'
import { env } from '$env/dynamic/public'

export type NeynarUserProfile = {
	fid: number
	username: string
	displayName?: string
	pfpUrl?: string
}

/** Lookup user by username. Returns null if not found or API key missing. */
export const fetchUserByUsername = async (
	username: string,
): Promise<NeynarUserProfile | null> => {
	const key = env.PUBLIC_NEYNAR_API_KEY
	if (!key) return null
	const res = await fetch(
		`${FARCASTER_NEYNAR_API_URL}/v2/farcaster/user/by_username/?username=${encodeURIComponent(username)}&viewer_fid=1`,
		{ headers: { 'x-api-key': key } },
	)
	if (!res.ok) return null
	const json = (await res.json()) as {
		user?: { fid?: number; username?: string; display_name?: string; pfp_url?: string }
	}
	const u = json?.user
	if (!u?.fid) return null
	return {
		fid: u.fid,
		username: u.username ?? '',
		displayName: u.display_name,
		pfpUrl: u.pfp_url,
	}
}

/** Lookup cast by hash only. Hub requires fid+hash; Neynar can resolve by hash alone. */
export const fetchCastByHash = async (
	hash: `0x${string}`,
): Promise<{ fid: number; hash: `0x${string}` } | null> => {
	const neynarKey = env.PUBLIC_NEYNAR_API_KEY
	if (!neynarKey) return null
	const res = await fetch(
		`${FARCASTER_NEYNAR_API_URL}/v2/farcaster/cast/?identifier=${encodeURIComponent(hash)}&type=hash`,
		{ headers: { 'x-api-key': neynarKey } },
	)
	if (!res.ok) return null
	const json = (await res.json()) as { cast?: { hash?: string; author?: { fid?: number } } }
	const cast = json?.cast
	if (!cast?.hash || cast.author?.fid == null) return null
	const h = (cast.hash.startsWith('0x') ? cast.hash : `0x${cast.hash}`) as `0x${string}`
	return { fid: cast.author.fid, hash: h }
}
