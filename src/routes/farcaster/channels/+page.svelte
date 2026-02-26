<script lang="ts">
	// Types/constants
	import type { FarcasterChannelRow } from '$/collections/FarcasterChannels.ts'
	import type { Sort } from '$/components/Sorts.svelte'
	import { farcasterCastsCollection } from '$/collections/FarcasterCasts.ts'
	import {
		INITIAL_CHANNELS_LIMIT,
		channelsRemainderCount,
		farcasterChannelsCollection,
		loadMoreChannels,
	} from '$/collections/FarcasterChannels.ts'
	import { useFarcasterConnections } from '$/collections/FarcasterConnections.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { farcasterComboboxFilterGroup } from '$/lib/farcaster-filters.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	const connectionsQuery = useFarcasterConnections()
	const castsQuery = useLiveQuery(
		(q) =>
			q.from({ row: farcasterCastsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const channelsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: farcasterChannelsCollection })
				.where(({ row }) => eq(row.$source, DataSource.Farcaster))
				.select(({ row }) => ({ row })),
		[],
	)


	// (Derived)
	const connectedFids = $derived(
		new Set(
			(connectionsQuery.data ?? []).map(
				(r) => (r.row as { $id: { fid: number } }).$id.fid,
			),
		),
	)
	const connectedChannelUrls = $derived(
		new Set(
			(castsQuery.data ?? [])
				.map(({ row: channel }) => channel as { $id: { fid: number }; parentUrl?: string })
				.filter((c) => connectedFids.has(c.$id.fid) && c.parentUrl)
				.map((c) => c.parentUrl as string),
		),
	)
	const allChannels = $derived(
		(channelsQuery.data ?? []).map(({ row: channel }) => channel) as FarcasterChannelRow[],
	)
	const nameFilters = $derived(
		[...new Set(allChannels.map((c) => c.name))].sort().map((name) => ({
			id: name,
			label: name,
			filterFunction: (ch: FarcasterChannelRow) => (ch.name === name),
		})),
	)
	const connectionFilters = $derived(
		connectedFids.size > 0
			? [
					{
						id: 'has-connected-casts',
						label: 'Has casts from connected account',
						filterFunction: (ch: FarcasterChannelRow) =>
							!!(ch.url && connectedChannelUrls.has(ch.url)),
					},
				]
			: [],
	)
	const filterGroups = $derived([
		...(nameFilters.length > 1
			? [farcasterComboboxFilterGroup('name', 'Channel', nameFilters)]
			: []),
		...(connectionFilters.length > 0
			? [farcasterComboboxFilterGroup('connection', 'Connection', connectionFilters)]
			: []),
	])
	const defaultFilterIds = $derived(
		new Set(
			allChannels
				.filter((c) => c.url && connectedChannelUrls.has(c.url))
				.map((c) => c.name),
		),
	)
	const remainderCount = $derived(
		allChannels.length === INITIAL_CHANNELS_LIMIT ? channelsRemainderCount() : 0,
	)


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import LoadMorePlaceholder from '$/components/LoadMorePlaceholder.svelte'
	import FarcasterFilteredEntityList from '$/views/farcaster/FarcasterFilteredEntityList.svelte'
</script>

<svelte:head>
	<title>Channels · Farcaster</title>
</svelte:head>

<main data-column="gap-4">
	<h1>Channels</h1>
	<FarcasterFilteredEntityList
		title="Channels"
		items={allChannels}
		isLoading={channelsQuery.isLoading}
		{filterGroups}
		defaultFilterIds={defaultFilterIds}
		sortOptions={[
			{
				id: 'name-asc',
				label: 'Name A–Z',
				compare: (a, b) => a.name.localeCompare(b.name),
			},
			{
				id: 'name-desc',
				label: 'Name Z–A',
				compare: (a, b) => b.name.localeCompare(a.name),
			},
			{
				id: 'followers-desc',
				label: 'Followers (high first)',
				compare: (a, b) => (b.followerCount ?? 0) - (a.followerCount ?? 0),
			},
			{
				id: 'followers-asc',
				label: 'Followers (low first)',
				compare: (a, b) => (a.followerCount ?? 0) - (b.followerCount ?? 0),
			},
		] as Sort<FarcasterChannelRow, 'name-asc' | 'name-desc' | 'followers-desc' | 'followers-asc'>[]}
		defaultSortId="name-asc"
		getKey={(ch) => ch.$id.id}
		emptyMessage="No channels found."
	>
		{#snippet Item({ item: ch })}
			<EntityView
				entityType={EntityType.FarcasterChannel}
				entity={ch}
				titleHref="/farcaster/channel/{encodeURIComponent(ch.$id.id)}"
				label={ch.name}
				metadata={
					ch.followerCount != null
						? [{ term: 'Followers', detail: String(ch.followerCount) }]
						: undefined
				}
			/>
		{/snippet}
		{#snippet AfterList()}
			<LoadMorePlaceholder
				count={remainderCount}
				onLoadMore={loadMoreChannels}
				label="Load more channels"
			/>
		{/snippet}
	</FarcasterFilteredEntityList>
</main>
