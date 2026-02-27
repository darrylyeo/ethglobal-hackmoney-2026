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

	enum FarcasterChannelSort {
		NameAsc = 'name-asc',
		NameDesc = 'name-desc',
		FollowersDesc = 'followers-desc',
		FollowersAsc = 'followers-asc',
	}

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


	// State (bound from RefinableItemsList)
	let displayCount = $state(0)

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import LoadMorePlaceholder from '$/components/LoadMorePlaceholder.svelte'
	import RefinableItemsList from '$/components/RefinableItemsList.svelte'
</script>

<svelte:head>
	<title>Channels · Farcaster</title>
</svelte:head>

<main data-column="gap-4">
	<h1>Channels</h1>
	<details data-card data-scroll-container="block" open>
		<summary>
			<h3 class="section-heading">Channels ({displayCount})</h3>
		</summary>
		{#if allChannels.length === 0 && channelsQuery.isLoading}
			<p data-text="muted">Loading…</p>
		{:else if allChannels.length === 0}
			<p data-text="muted">No channels found.</p>
		{:else}
			<div data-column="gap-4">
				<RefinableItemsList
					items={allChannels}
					{filterGroups}
					defaultFilterIds={defaultFilterIds}
					sortOptions={[
						{
							id: FarcasterChannelSort.NameAsc,
							label: 'Name A–Z',
							compare: (a, b) => a.name.localeCompare(b.name),
						},
						{
							id: FarcasterChannelSort.NameDesc,
							label: 'Name Z–A',
							compare: (a, b) => b.name.localeCompare(a.name),
						},
						{
							id: FarcasterChannelSort.FollowersDesc,
							label: 'Followers (high first)',
							compare: (a, b) => (b.followerCount ?? 0) - (a.followerCount ?? 0),
						},
						{
							id: FarcasterChannelSort.FollowersAsc,
							label: 'Followers (low first)',
							compare: (a, b) => (a.followerCount ?? 0) - (b.followerCount ?? 0),
						},
					] as Sort<FarcasterChannelRow, FarcasterChannelSort>[]}
					defaultSortId={FarcasterChannelSort.NameAsc}
					getKey={(ch) => ch.$id.id}
					bind:displayCount
					placeholderKeys={new Set<string>()}
				>
					{#snippet Empty()}
						<p data-text="muted">No channels match filters.</p>
					{/snippet}
					{#snippet Item({ key: _key, item: row, isPlaceholder })}
						{#if !isPlaceholder && row != null}
							{@const ch = row}
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
						{/if}
					{/snippet}
				</RefinableItemsList>
				<LoadMorePlaceholder
					count={remainderCount}
					onLoadMore={loadMoreChannels}
					label="Load more channels"
				/>
			</div>
		{/if}
	</details>
</main>

<style>
	.section-heading {
		font-size: 1rem;
		margin: 0;
	}
</style>
