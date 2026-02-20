import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { FarcasterCast, FarcasterCast$Id } from '$/data/FarcasterCast.ts'
import { dedupeInFlight } from '$/lib/dedupeInFlight.ts'
import {
	fetchCastById,
	fetchCastByHash,
	fetchCastsByMention,
	fetchCastsByParent,
	fetchReactionsByCast,
	isFullHash,
	isTruncatedHash,
	REACTION_TYPE_LIKE,
	REACTION_TYPE_RECAST,
	resolveCastByTruncatedHash,
	type CastMessage,
} from '$/api/farcaster/index.ts'

export type FarcasterCastRow = FarcasterCast & { $source: DataSource }

const getKey = (row: FarcasterCastRow) =>
	`${row.$id.fid}:${row.$id.hash}`

const normalizeCast = (m: CastMessage): FarcasterCastRow => {
	const body = m.data?.castAddBody ?? { text: '', mentions: [], embeds: [] }
	const data = m.data ?? { fid: 0, timestamp: 0 }
	return {
		$id: { fid: data.fid, hash: m.hash },
		text: body.text ?? '',
		parentFid: body.parentCastId?.fid,
		parentHash: body.parentCastId?.hash,
		parentUrl: body.parentUrl,
		timestamp: data.timestamp ?? 0,
		mentions: body.mentions ?? [],
		embeds:
			body.embeds?.map((e) =>
				'castId' in e && e.castId
					? { castId: { fid: e.castId.fid, hash: e.castId.hash } }
					: { url: 'url' in e ? e.url : undefined },
			) ?? [],
		$source: DataSource.Farcaster,
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

export const ensureCastsForChannel = async (
	channelUrl: string,
	pageToken?: string,
): Promise<{ nextPageToken?: string }> =>
	dedupeInFlight(`castsChannel:${channelUrl}:${pageToken ?? 'first'}`, async () => {
		const { messages, nextPageToken } = await fetchCastsByParent({
			url: channelUrl,
			pageSize: 25,
			pageToken,
		})
		for (const m of messages) {
			const row = normalizeCast(m)
			farcasterCastsCollection.insert(row)
		}
		return { nextPageToken }
	})

export const ensureCastsForFid = async (
	fid: number,
	pageToken?: string,
): Promise<{ nextPageToken?: string }> =>
	dedupeInFlight(`castsFid:${fid}:${pageToken ?? 'first'}`, async () => {
		const { messages, nextPageToken } = await fetchCastsByFid(fid, {
			pageSize: 25,
			pageToken,
			reverse: true,
		})
		for (const m of messages) {
			const row = normalizeCast(m)
			farcasterCastsCollection.insert(row)
		}
		return { nextPageToken }
	})

/** Resolve cast by full hash only. Uses collection lookup or Neynar API. */
export const ensureCastByHash = async (
	hash: `0x${string}`,
): Promise<FarcasterCastRow> => {
	if (!isFullHash(hash)) throw new Error('Full hash required for hash-only lookup')
	const existingByHash = [...farcasterCastsCollection.state.values()].find(
		(r) => (r as FarcasterCastRow).$id.hash === hash,
	) as FarcasterCastRow | undefined
	if (existingByHash) return ensureCast(existingByHash.$id.fid, hash)
	const resolved = await fetchCastByHash(hash)
	if (!resolved) throw new Error('Cast not found')
	return ensureCast(resolved.fid, resolved.hash)
}

export const ensureCast = async (
	fid: number,
	hash: `0x${string}`,
): Promise<FarcasterCastRow> =>
	dedupeInFlight(`cast:${fid}:${hash}`, async () => {
		const key = `${fid}:${hash}`
		const existing = farcasterCastsCollection.state.get(key) as
			| FarcasterCastRow
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
		const row = normalizeCast(m)
		const fullHash = m.hash
		const [likesRes, recastsRes] = await Promise.all([
			fetchReactionsByCast(fid, fullHash, { reactionType: REACTION_TYPE_LIKE }).catch(
				() => ({ messages: [] }),
			),
			fetchReactionsByCast(fid, fullHash, { reactionType: REACTION_TYPE_RECAST }).catch(
				() => ({ messages: [] }),
			),
		])
		row.likeCount = likesRes.messages?.length ?? 0
		row.recastCount = recastsRes.messages?.length ?? 0
		farcasterCastsCollection.insert(row)
		return row
	})

export const ensureCastsByMention = async (
	fid: number,
	pageToken?: string,
): Promise<{ nextPageToken?: string }> =>
	dedupeInFlight(`castsMention:${fid}:${pageToken ?? 'first'}`, async () => {
		const { messages, nextPageToken } = await fetchCastsByMention(fid, {
			pageSize: 25,
			pageToken,
			reverse: true,
		})
		for (const m of messages) {
			const row = normalizeCast(m)
			farcasterCastsCollection.insert(row)
		}
		return { nextPageToken }
	})

/** Ensure cast and all ancestors are loaded. Used when viewing a reply to show full thread context. */
export const ensureCastAncestorChain = async (
	c: FarcasterCastRow,
): Promise<void> => {
	if (!c.parentFid || !c.parentHash) return
	const parent = await ensureCast(c.parentFid, c.parentHash)
	await ensureRepliesForCast(c.parentFid, c.parentHash)
	await ensureCastAncestorChain(parent)
}

export const ensureRepliesForCast = async (
	fid: number,
	hash: `0x${string}`,
	pageToken?: string,
): Promise<{ nextPageToken?: string }> =>
	dedupeInFlight(
		`replies:${fid}:${hash}:${pageToken ?? 'first'}`,
		async () => {
			const { messages, nextPageToken } = await fetchCastsByParent({
				fid,
				hash,
				pageSize: 25,
				pageToken,
			})
			for (const m of messages) {
				const row = normalizeCast(m)
				farcasterCastsCollection.insert(row)
			}
			return { nextPageToken }
		},
	)
