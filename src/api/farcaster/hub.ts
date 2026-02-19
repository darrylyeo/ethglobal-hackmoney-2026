/**
 * Farcaster Hub HTTP API (protocol-standard).
 * Shared across Pinata, Standard Crypto, Neynar Snapchain. /v1/* message endpoints.
 */

import {
	FARCASTER_HUB_NODES,
	FARCASTER_NEYNAR_HUB_URL,
} from '$/constants/farcaster.ts'
import { env } from '$env/dynamic/public'

const HUB_BASE_URLS = FARCASTER_HUB_NODES.map((e) => e.url)

const getHubUrls = (): string[] =>
	env.PUBLIC_NEYNAR_API_KEY
		? [FARCASTER_NEYNAR_HUB_URL, ...HUB_BASE_URLS]
		: HUB_BASE_URLS

const toQuery = (params?: Record<string, string | number | boolean | undefined>) => {
	const sp = new URLSearchParams()
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined) sp.set(k, String(v))
		}
	}
	return sp.toString()
}

const getHub = async <T>(
	endpoint: string,
	params?: Record<string, string | number | boolean | undefined>,
) => {
	const q = toQuery(params)
	const suffix = q ? `?${q}` : ''
	const urls = getHubUrls()
	const neynarKey = env.PUBLIC_NEYNAR_API_KEY
	let lastError: Error | undefined
	for (const base of urls) {
		const isNeynar = base === FARCASTER_NEYNAR_HUB_URL
		try {
			const headers: Record<string, string> = {}
			if (isNeynar && neynarKey) headers['x-api-key'] = neynarKey
			const res = await fetch(`${base}${endpoint}${suffix}`, { headers })
			if (res.ok) return res.json() as Promise<T>
			lastError = new Error(`Hub ${base}: ${res.status}`)
		} catch (e) {
			lastError = e instanceof Error ? e : new Error(String(e))
		}
	}
	throw lastError ?? new Error('All hub endpoints failed')
}

export type CastMessage = {
	hash: `0x${string}`
	data: {
		fid: number
		timestamp: number
		castAddBody?: {
			text: string
			mentions?: number[]
			mentionsPositions?: number[]
			parentCastId?: { fid: number; hash: `0x${string}` }
			parentUrl?: string
			embeds?: { url?: string; castId?: { fid: number; hash: `0x${string}` } }[]
		}
	}
}

export const fetchCastsByParent = (options: {
	url?: string
	fid?: number
	hash?: `0x${string}`
	pageSize?: number
	pageToken?: string
}) =>
	getHub<{ messages: CastMessage[]; nextPageToken?: string }>(
		'/v1/castsByParent',
		{
			url: options.url,
			fid: options.fid,
			hash: options.hash,
			pageSize: options.pageSize ?? 25,
			pageToken: options.pageToken,
		},
	)

export const fetchCastsByFid = (
	fid: number,
	options?: { pageSize?: number; pageToken?: string; reverse?: boolean },
) =>
	getHub<{ messages: CastMessage[]; nextPageToken?: string }>(
		'/v1/castsByFid',
		{
			fid,
			pageSize: options?.pageSize ?? 25,
			pageToken: options?.pageToken,
			reverse: options?.reverse ?? true,
		},
	)

const HASH_LEN_HEX = 40

export const fetchCastById = (fid: number, hash: `0x${string}`) =>
	getHub<CastMessage>('/v1/castById', { fid, hash })

export const isTruncatedHash = (hash: `0x${string}`): boolean =>
	hash.length < 2 + HASH_LEN_HEX

export const isFullHash = (hash: `0x${string}`): boolean =>
	hash.length >= 2 + HASH_LEN_HEX && /^0x[a-fA-F0-9]+$/.test(hash)

export const resolveCastByTruncatedHash = async (
	fid: number,
	hash: `0x${string}`,
): Promise<CastMessage | undefined> => {
	const prefix = hash.slice(2).toLowerCase()
	let pageToken: string | undefined
	do {
		const { messages, nextPageToken } = await fetchCastsByFid(fid, {
			pageSize: 100,
			pageToken,
			reverse: true,
		})
		const m = messages.find((msg) =>
			msg.hash.toLowerCase().slice(2).startsWith(prefix),
		)
		if (m) return m
		pageToken = nextPageToken
	} while (pageToken)
	return undefined
}

export const REACTION_TYPE_LIKE = 1
export const REACTION_TYPE_RECAST = 2

export type ReactionMessage = { data?: { fid: number } }

export const fetchReactionsByCast = (
	targetFid: number,
	targetHash: `0x${string}`,
	options: { reactionType: number; pageSize?: number; pageToken?: string },
) =>
	getHub<{ messages: ReactionMessage[]; nextPageToken?: string }>(
		'/v1/reactionsByCast',
		{
			target_fid: targetFid,
			target_hash: targetHash,
			reaction_type: options.reactionType,
			pageSize: options.pageSize ?? 100,
			pageToken: options.pageToken,
		},
	)

export type VerificationMessage = {
	data?: {
		verificationAddEthAddressBody?: { address?: `0x${string}` }
	}
}

export const fetchVerificationsByFid = (
	fid: number,
	options?: { pageSize?: number; pageToken?: string },
) =>
	getHub<{ messages: VerificationMessage[]; nextPageToken?: string }>(
		'/v1/verificationsByFid',
		{
			fid,
			pageSize: options?.pageSize ?? 100,
			pageToken: options?.pageToken,
		},
	)

export const fetchCastsByMention = (
	fid: number,
	options?: { pageSize?: number; pageToken?: string; reverse?: boolean },
) =>
	getHub<{ messages: CastMessage[]; nextPageToken?: string }>(
		'/v1/castsByMention',
		{
			fid,
			pageSize: options?.pageSize ?? 25,
			pageToken: options?.pageToken,
			reverse: options?.reverse ?? true,
		},
	)

export type LinkMessage = {
	data?: {
		fid: number
		linkBody?: { type?: string; targetFid?: number }
	}
}

export const LINK_TYPE_FOLLOW = 'follow'

export const fetchLinksByFid = (
	fid: number,
	options?: {
		linkType?: string
		pageSize?: number
		pageToken?: string
		reverse?: boolean
	},
) => {
	const params: Record<string, string | number | boolean | undefined> = {
		fid,
		pageSize: options?.pageSize ?? 100,
		pageToken: options?.pageToken,
		reverse: options?.reverse ?? true,
	}
	if (options?.linkType != null) params.link_type = options.linkType
	return getHub<{ messages: LinkMessage[]; nextPageToken?: string }>(
		'/v1/linksByFid',
		params,
	)
}

export const fetchLinksByTargetFid = (
	targetFid: number,
	options?: {
		linkType?: string
		pageSize?: number
		pageToken?: string
		reverse?: boolean
	},
) => {
	const params: Record<string, string | number | boolean | undefined> = {
		target_fid: targetFid,
		pageSize: options?.pageSize ?? 100,
		pageToken: options?.pageToken,
		reverse: options?.reverse ?? true,
	}
	if (options?.linkType != null) params.link_type = options.linkType
	return getHub<{ messages: LinkMessage[]; nextPageToken?: string }>(
		'/v1/linksByTargetFid',
		params,
	)
}

export type UserDataMessage = {
	data: {
		userDataBody?: { type: string; value: string }
	}
}

export const fetchUserDataByFid = (fid: number) =>
	getHub<{ messages: UserDataMessage[] }>('/v1/userDataByFid', {
		fid,
		pageSize: 100,
	})

export const fetchUsernameProofsByFid = (fid: number) =>
	getHub<{ proofs: { name: string }[] }>('/v1/userNameProofsByFid', { fid })

export type OnChainIdRegistryEvent = {
	fid?: number
	type?: string
	idRegistryEventBody?: { to?: string }
}

export const fetchOnChainIdRegistryEventByAddress = (address: `0x${string}`) =>
	getHub<OnChainIdRegistryEvent>('/v1/onChainIdRegistryEventByAddress', {
		address,
	})

const fidByAddressCache = new Map<string, number | null>()

export const getFidByAddress = async (
	address: `0x${string}`,
): Promise<number | null> => {
	const cached = fidByAddressCache.get(address.toLowerCase())
	if (cached !== undefined) return cached
	try {
		const res = await fetchOnChainIdRegistryEventByAddress(address)
		const fid = res.fid ?? null
		fidByAddressCache.set(address.toLowerCase(), fid)
		return fid
	} catch {
		fidByAddressCache.set(address.toLowerCase(), null)
		return null
	}
}
