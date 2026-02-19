import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { FarcasterChannel, FarcasterChannel$Id } from '$/data/FarcasterChannel.ts'
import { queryClient } from '$/lib/db/query-client.ts'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { createCollection } from '@tanstack/svelte-db'
import {
	fetchAllChannels,
	fetchChannel,
	type Channel,
} from '$/api/farcaster.ts'

export type FarcasterChannelRow = FarcasterChannel & { $source: DataSource }

export const INITIAL_CHANNELS_LIMIT = 100
const FARCASTER_CHANNELS_QUERY_KEY = ['farcaster-channels'] as const

let channelsRemainder: FarcasterChannelRow[] = []

const normalizeChannel = (c: Channel): FarcasterChannelRow => ({
	$id: { id: c.id },
	name: c.name,
	url: c.url,
	description: c.description,
	imageUrl: c.imageUrl,
	followerCount: c.followerCount,
	memberCount: c.memberCount,
	$source: DataSource.Farcaster,
})

export const farcasterChannelsCollection = createCollection(
	queryCollectionOptions({
		id: CollectionId.FarcasterChannels,
		queryKey: FARCASTER_CHANNELS_QUERY_KEY,
		queryFn: async () => {
			const { result } = await fetchAllChannels()
			const all = result.channels.map(normalizeChannel)
			if (all.length > INITIAL_CHANNELS_LIMIT) {
				channelsRemainder = all.slice(INITIAL_CHANNELS_LIMIT)
				return all.slice(0, INITIAL_CHANNELS_LIMIT)
			}
			channelsRemainder = []
			return all
		},
		queryClient,
		getKey: (row: FarcasterChannelRow) => row.$id.id,
	}),
)

export const channelsRemainderCount = () => channelsRemainder.length

export const loadMoreChannels = (): void => {
	if (channelsRemainder.length === 0) return
	const current = queryClient.getQueryData<FarcasterChannelRow[]>(
		FARCASTER_CHANNELS_QUERY_KEY,
	)
	const full = current ? [...current, ...channelsRemainder] : [...channelsRemainder]
	channelsRemainder = []
	queryClient.setQueryData(FARCASTER_CHANNELS_QUERY_KEY, full)
}

export const ensureFarcasterChannel = async (
	channelId: string,
): Promise<FarcasterChannelRow | null> => {
	const key = channelId
	const existing = farcasterChannelsCollection.state.get(key) as
		| FarcasterChannelRow
		| undefined
	if (existing) return existing
	const remainderMatch = channelsRemainder.find((c) => c.$id.id === channelId)
	if (remainderMatch) {
		loadMoreChannels()
		return remainderMatch
	}
	try {
		const { result } = await fetchChannel(channelId)
		const row = normalizeChannel(result.channel)
		channelsRemainder = channelsRemainder.filter((c) => c.$id.id !== channelId)
		const current = queryClient.getQueryData<FarcasterChannelRow[]>(
			FARCASTER_CHANNELS_QUERY_KEY,
		)
		const exists = current?.some((c) => c.$id.id === channelId)
		if (!exists)
			queryClient.setQueryData(FARCASTER_CHANNELS_QUERY_KEY, [
				...(current ?? []),
				row,
			])
		return row
	} catch {
		return null
	}
}
