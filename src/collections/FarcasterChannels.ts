import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId, type WithSource } from '$/constants/data-sources.ts'
import type { FarcasterChannel, FarcasterChannel$Id } from '$/data/FarcasterChannel.ts'
import { queryClient } from '$/lib/db/queryClient.ts'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { createCollection } from '@tanstack/svelte-db'
import {
	fetchAllChannels,
	fetchChannel,
	type Channel,
} from '$/api/farcaster/client.ts'

export const INITIAL_CHANNELS_LIMIT = 100

const farcasterChannelsQueryKey = [CollectionId.FarcasterChannels] as const

let channelsRemainder: WithSource<FarcasterChannel>[] = []

const normalizeChannel = (c: Channel): WithSource<FarcasterChannel> => ({
	$id: { id: c.id },
	name: c.name,
	url: c.url,
	description: c.description,
	imageUrl: c.imageUrl,
	followerCount: c.followerCount,
	memberCount: c.memberCount,
	$source: DataSourceId.Farcaster,
})

export const farcasterChannelsCollection = createCollection(
	queryCollectionOptions({
		id: CollectionId.FarcasterChannels,
		queryKey: farcasterChannelsQueryKey,
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
		getKey: (row: WithSource<FarcasterChannel>) => row.$id.id,
	}),
)

export const channelsRemainderCount = () => channelsRemainder.length

export const loadMoreChannels = (): void => {
	if (channelsRemainder.length === 0) return
	const current = queryClient.getQueryData<WithSource<FarcasterChannel>[]>(
		farcasterChannelsQueryKey,
	)
	const full = current ? [...current, ...channelsRemainder] : [...channelsRemainder]
	channelsRemainder = []
	queryClient.setQueryData(farcasterChannelsQueryKey, full)
}

export const ensureFarcasterChannel = async (
	channelId: string,
): Promise<WithSource<FarcasterChannel> | null> => {
	const key = channelId
	const existing = farcasterChannelsCollection.state.get(key) as
		| WithSource<FarcasterChannel>
		| undefined
	if (existing) return existing
	const remainderMatch = channelsRemainder.find((c) => c.$id.id === channelId)
	if (remainderMatch) {
		loadMoreChannels()
		return remainderMatch
	}
	try {
		const { result } = await fetchChannel(channelId)
		const channel = normalizeChannel(result.channel)
		channelsRemainder = channelsRemainder.filter((c) => c.$id.id !== channelId)
		const current = queryClient.getQueryData<WithSource<FarcasterChannel>[]>(
			farcasterChannelsQueryKey,
		)
		const exists = current?.some((c) => c.$id.id === channelId)
		if (!exists)
			queryClient.setQueryData(farcasterChannelsQueryKey, [
				...(current ?? []),
				channel,
			])
		return channel
	} catch {
		return null
	}
}
