<script lang="ts">
	// Types/constants
	import type { FarcasterCastRow } from '$/collections/FarcasterCasts.ts'
	import {
		ensureCastsForChannel,
		farcasterCastsCollection,
	} from '$/collections/FarcasterCasts.ts'
	import {
		ensureFarcasterChannel,
		farcasterChannelsCollection,
	} from '$/collections/FarcasterChannels.ts'
	import {
		ensureFarcasterUser,
		farcasterUsersCollection,
	} from '$/collections/FarcasterUsers.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { page } from '$app/state'


	// (Derived)
	const channelId = $derived(page.params.channelId ?? '')


	// Context
	const channelsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: farcasterChannelsCollection })
				.where(({ row }) => eq(row.$id.id, channelId))
				.select(({ row }) => ({ row })),
		[() => [channelId]],
	)
	const usersQuery = useLiveQuery(
		(q) =>
			q.from({ row: farcasterUsersCollection }).select(({ row }) => ({ row })),
		[],
	)


	// (Derived)
	const channel = $derived(channelsQuery.data?.[0]?.row)
	const channelUrl = $derived(
		channel?.url ?? `https://warpcast.com/~/channel/${channelId}`,
	)


	// Context
	const castsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: farcasterCastsCollection })
				.where(({ row }) => eq(row.parentUrl, channelUrl))
				.select(({ row }) => ({ row })),
		[() => [channelUrl]],
	)


	// (Derived)
	const userByFid = $derived(
		new Map(
			(usersQuery.data ?? []).map((r) => [r.row.$id.fid, r.row]),
		),
	)
	const castsByChannel = $derived(
		(castsQuery.data ?? []).map((r) => r.row as FarcasterCastRow),
	)
	const rootCasts = $derived(
		castsByChannel.filter((c) => !c.parentFid || !c.parentHash),
	)
	const castsSet = $derived(new Set(rootCasts))
	const placeholderKeys = $derived(
		new Set<string | [number, number]>(['loading']),
	)


	// State
	let castsNextToken = $state<string | undefined>(undefined)
	let isLoadingMoreCasts = $state(false)


	// Actions
	$effect(() => {
		if (channelId && !channel && !channelsQuery.isLoading)
			ensureFarcasterChannel(channelId).catch(() => {})
	})
	$effect(() => {
		if (channelId && channelUrl) {
			ensureCastsForChannel(channelUrl)
				.then(({ nextPageToken }) => (castsNextToken = nextPageToken))
				.catch(() => {})
		} else {
			castsNextToken = undefined
		}
	})
	const loadMoreCasts = () => {
		if (!castsNextToken || isLoadingMoreCasts) return
		isLoadingMoreCasts = true
		ensureCastsForChannel(channelUrl, castsNextToken)
			.then(({ nextPageToken }) => (castsNextToken = nextPageToken))
			.catch(() => {})
			.finally(() => (isLoadingMoreCasts = false))
	}
	$effect(() => {
		for (const c of rootCasts) {
			ensureFarcasterUser(c.$id.fid).catch(() => {})
		}
	})


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import FarcasterCastsEntityList from '$/views/farcaster/FarcasterCastsEntityList.svelte'
</script>

<svelte:head>
	<title>{channel?.name ?? channelId} · Farcaster</title>
</svelte:head>

<main data-column="gap-4">
	{#if channel}
		<EntityView
			entityType={EntityType.FarcasterChannel}
			entity={channel}
			idSerialized={channel.$id.id}
			href="/farcaster/channel/{encodeURIComponent(channel.$id.id)}"
			label={channel.name}
			metadata={
				channel.followerCount != null
					? [{ term: 'Followers', detail: String(channel.followerCount) }]
					: undefined
			}
		>
			{#snippet children()}
				<FarcasterCastsEntityList
					title="Casts"
					items={castsSet}
					loaded={castsSet.size}
					total={rootCasts.length > 0 ? rootCasts.length : undefined}
					{userByFid}
					placeholderKeys={placeholderKeys}
					pagination={{
						hasMore: !!castsNextToken,
						onLoadMore: loadMoreCasts,
						loading: isLoadingMoreCasts,
						label: 'Load more casts',
					}}
				/>
			{/snippet}
		</EntityView>
	{:else if channelsQuery.isLoading}
		<p>Loading channel…</p>
	{:else}
		<p>Channel not found: {channelId}</p>
	{/if}
</main>
