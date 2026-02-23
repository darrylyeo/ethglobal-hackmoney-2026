import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { CollectionId } from '$/constants/collections.ts'
import { singleFlight } from '$/lib/singleFlight.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { FarcasterLink } from '$/data/FarcasterLink.ts'
import {
	fetchLinksByFid,
	fetchLinksByTargetFid,
	LINK_TYPE_FOLLOW,
	type LinkMessage,
} from '$/api/farcaster/index.ts'
import { ensureFarcasterUser } from '$/collections/FarcasterUsers.ts'

export type FarcasterLinkRow = FarcasterLink & { $source: DataSource }

const getKey = (row: FarcasterLinkRow) =>
	`${row.$id.sourceFid}:${row.$id.targetFid}:${row.$id.linkType}`

const normalizeLink = (
	sourceFid: number,
	targetFid: number,
	linkType: string,
): FarcasterLinkRow => ({
	$id: { sourceFid, targetFid, linkType },
	$source: DataSource.Farcaster,
})

export const farcasterLinksCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.FarcasterLinks,
		storageKey: CollectionId.FarcasterLinks,
		getKey,
		parser: { stringify, parse },
	}),
)

export const ensureFollowingForUser = singleFlight(
	async (
		fid: number,
		pageToken?: string,
	): Promise<{ nextPageToken?: string }> => {
		const { messages, nextPageToken } = await fetchLinksByFid(fid, {
			linkType: LINK_TYPE_FOLLOW,
			pageSize: 100,
			pageToken,
			reverse: true,
		})
		for (const m of messages) {
			const targetFid = m.data?.linkBody?.targetFid
			if (targetFid != null) {
				farcasterLinksCollection.insert(
					normalizeLink(m.data.fid, targetFid, LINK_TYPE_FOLLOW),
				)
				ensureFarcasterUser(targetFid).catch(() => {})
			}
		}
		return { nextPageToken }
	},
)

export const ensureFollowersForUser = singleFlight(
	async (
		targetFid: number,
		pageToken?: string,
	): Promise<{ nextPageToken?: string }> => {
		const { messages, nextPageToken } = await fetchLinksByTargetFid(targetFid, {
			linkType: LINK_TYPE_FOLLOW,
			pageSize: 100,
			pageToken,
			reverse: true,
		})
		for (const m of messages) {
			const sourceFid = m.data?.fid
			if (sourceFid != null) {
				farcasterLinksCollection.insert(
					normalizeLink(sourceFid, targetFid, LINK_TYPE_FOLLOW),
				)
				ensureFarcasterUser(sourceFid).catch(() => {})
			}
		}
		return { nextPageToken }
	},
)
