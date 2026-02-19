/**
 * Farcaster Client API (api.farcaster.xyz).
 * Official protocol REST API for channels, discover. No API key for read.
 */

import { FARCASTER_CLIENT_API_URL } from '$/constants/farcaster.ts'

const toQuery = (params?: Record<string, string | number | boolean | undefined>) => {
	const sp = new URLSearchParams()
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined) sp.set(k, String(v))
		}
	}
	return sp.toString()
}

const get = async <T>(
	endpoint: string,
	params?: Record<string, string | number | boolean | undefined>,
) => {
	const q = toQuery(params)
	const url = `${FARCASTER_CLIENT_API_URL}${endpoint}${q ? `?${q}` : ''}`
	const res = await fetch(url)
	if (!res.ok) throw new Error(`Farcaster Client API: ${res.status}`)
	return res.json() as Promise<T>
}

export type Channel = {
	id: string
	url: string
	name: string
	description?: string
	imageUrl?: string
	followerCount?: number
	memberCount?: number
}

export const fetchAllChannels = () =>
	get<{ result: { channels: Channel[] } }>('/v2/all-channels')

export const fetchChannel = (channelId: string) =>
	get<{ result: { channel: Channel } }>('/v1/channel', { channelId })
