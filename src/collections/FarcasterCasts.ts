import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import type { FarcasterCast, FarcasterCast$Id } from '$/data/FarcasterCast.ts'
import { singleFlight } from '$/lib/singleFlight.ts'
import {
	fetchCastById,
	fetchCastsByMention,
	fetchCastsByParent,
	fetchReactionsByCast,
	isFullHash,
	isTruncatedHash,
	REACTION_TYPE_LIKE,
	REACTION_TYPE_RECAST,
	resolveCastByTruncatedHash,
	type CastMessage,
} from '$/api/farcaster/hub.ts'
import { fetchCastByHash } from '$/api/farcaster/neynar.ts'

/** Normalize cast hash to lowercase for consistent cache keys. */
const normalizeCastHash = (h: `0x${string}`): `0x${string}` =>
	h.slice(0, 2) + h.slice(2).toLowerCase() as `0x${string}`

const getKey = (row: WithSource<FarcasterCast>) =>
	`${row.$id.fid}:${normalizeCastHash(row.$id.hash)}`

/** FarcasterCast.timestamp is stored as Unix ms. API returns seconds; normalize at ingest. */
const toTimestampMs = (t: number): number => (t < 1e12 ? t * 1000 : t)

const normalizeCast = (m: CastMessage): WithSource<FarcasterCast> | null => {
	const data = m.data
	if (!data) return null
	const body = data.castAddBody ?? { text: '', mentions: [], embeds: [] }
	return {
		$id: { fid: data.fid, hash: normalizeCastHash(m.hash as `0x${string}`) },
		text: body.text ?? '',
		parentFid: body.parentCastId?.fid,
		parentHash: body.parentCastId?.hash
			? normalizeCastHash(body.parentCastId.hash as `0x${string}`)
			: undefined,
		parentUrl: body.parentUrl,
		timestamp: toTimestampMs(data.timestamp ?? 0),
		mentions: body.mentions ?? [],
		embeds:
			body.embeds?.map((e) =>
				'castId' in e && e.castId
					? {
							castId: {
								fid: e.castId.fid,
								hash: normalizeCastHash(e.castId.hash as `0x${string}`),
							},
						}
					: { url: 'url' in e ? e.url : undefined },
			) ?? [],
		$source: DataSourceId.Farcaster,
	}
}

export const farcasterCastsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.FarcasterCasts,
		storageKey: CollectionId.FarcasterCasts,
		getKey,
		parser: { stringify, parse },
	}),
)

export const ensureCastsForChannel = singleFlight(
	async (
		channelUrl: string,
		pageToken?: string,
	): Promise<{ nextPageToken?: string }> => {
		const { messages, nextPageToken } = await fetchCastsByParent({
			url: channelUrl,
			pageSize: 25,
			pageToken,
		})
		for (const m of messages) {
			const cast = normalizeCast(m)
			if (cast) farcasterCastsCollection.insert(cast)
		}
		return { nextPageToken }
	},
)

export const ensureCastsForFid = singleFlight(
	async (
		fid: number,
		pageToken?: string,
	): Promise<{ nextPageToken?: string }> => {
		const { messages, nextPageToken } = await fetchCastsByFid(fid, {
			pageSize: 25,
			pageToken,
			reverse: true,
		})
		for (const m of messages) {
			const cast = normalizeCast(m)
			if (cast) farcasterCastsCollection.insert(cast)
		}
		return { nextPageToken }
	},
)

/** Resolve cast by full hash only. Uses collection lookup or Neynar API. */
export const ensureCastByHash = async (
	hash: `0x${string}`,
): Promise<WithSource<FarcasterCast>> => {
	if (!isFullHash(hash)) throw new Error('Full hash required for hash-only lookup')
	const norm = normalizeCastHash(hash)
	const existingByHash = [...farcasterCastsCollection.state.values()].find(
		(r) => normalizeCastHash((r as WithSource<FarcasterCast>).$id.hash) === norm,
	) as WithSource<FarcasterCast> | undefined
	if (existingByHash) return ensureCast(existingByHash.$id.fid, hash)
	const resolved = await fetchCastByHash(hash)
	if (!resolved) throw new Error('Cast not found')
	return ensureCast(resolved.fid, resolved.hash)
}

export const ensureCast = singleFlight(
	async (
		fid: number,
		hash: `0x${string}`,
	): Promise<WithSource<FarcasterCast>> => {
		const key = `${fid}:${normalizeCastHash(hash)}`
		const existing = farcasterCastsCollection.state.get(key) as
			| WithSource<FarcasterCast>
			| undefined
		if (
			existing &&
			existing.likeCount != null &&
			existing.recastCount != null
		)
			return existing

		let m: CastMessage | undefined
		try {
			m = await fetchCastById(fid, hash)
		} catch {
			if (isTruncatedHash(hash))
				m = await resolveCastByTruncatedHash(fid, hash)
			if (!m) throw new Error('Cast not found')
		}
		const cast = normalizeCast(m)
		if (!cast) throw new Error('Cast not found')
		const fullHash = m.hash
		const [likesRes, recastsRes] = await Promise.all([
			fetchReactionsByCast(fid, fullHash, { reactionType: REACTION_TYPE_LIKE }).catch(
				() => ({ messages: [] }),
			),
			fetchReactionsByCast(fid, fullHash, { reactionType: REACTION_TYPE_RECAST }).catch(
				() => ({ messages: [] }),
			),
		])
		cast.likeCount = likesRes.messages?.length ?? 0
		cast.recastCount = recastsRes.messages?.length ?? 0
		farcasterCastsCollection.insert(cast)
		return cast
	},
)

export const ensureCastsByMention = singleFlight(
	async (
		fid: number,
		pageToken?: string,
	): Promise<{ nextPageToken?: string }> => {
		const { messages, nextPageToken } = await fetchCastsByMention(fid, {
			pageSize: 25,
			pageToken,
			reverse: true,
		})
		for (const m of messages) {
			const cast = normalizeCast(m)
			if (cast) farcasterCastsCollection.insert(cast)
		}
		return { nextPageToken }
	},
)

/** Ensure cast and all ancestors are loaded. Used when viewing a reply to show full thread context. */
export const ensureCastAncestorChain = async (
	c: WithSource<FarcasterCast>,
): Promise<void> => {
	if (!c.parentFid || !c.parentHash) return
	const parent = await ensureCast(c.parentFid, c.parentHash)
	await ensureRepliesForCast(c.parentFid, c.parentHash)
	await ensureCastAncestorChain(parent)
}

export const ensureRepliesForCast = singleFlight(
	async (
		fid: number,
		hash: `0x${string}`,
		pageToken?: string,
	): Promise<{ nextPageToken?: string }> => {
		const { messages, nextPageToken } = await fetchCastsByParent({
			fid,
			hash,
			pageSize: 25,
			pageToken,
		})
		for (const m of messages) {
			const cast = normalizeCast(m)
			if (cast) farcasterCastsCollection.insert(cast)
		}
		return { nextPageToken }
	},
)
