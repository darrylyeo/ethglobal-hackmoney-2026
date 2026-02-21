<script lang="ts">
	// Types/constants
	import type { FarcasterCastRow } from '$/collections/FarcasterCasts.ts'
	import type { FarcasterUserRow } from '$/collections/FarcasterUsers.ts'
	import type { Sort } from '$/components/Sorts.svelte'
	import { farcasterCastsCollection } from '$/collections/FarcasterCasts.ts'
	import { useFarcasterConnections } from '$/collections/FarcasterConnections.ts'
	import { ensureFarcasterUser, farcasterUsersCollection } from '$/collections/FarcasterUsers.ts'
	import { farcasterComboboxFilterGroup } from '$/lib/farcaster-filters.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'

	const contentFilters = [
		{
			id: 'has-embeds',
			label: 'Has embeds',
			filterFunction: (c: FarcasterCastRow) =>
				(c.embeds?.length ?? 0) > 0,
		},
		{
			id: 'has-quote',
			label: 'Has quote',
			filterFunction: (c: FarcasterCastRow) =>
				(c.embeds?.some((e) => e.castId) ?? false),
		},
		{
			id: 'has-url',
			label: 'Has URL embed',
			filterFunction: (c: FarcasterCastRow) =>
				(c.embeds?.some((e) => e.url) ?? false),
		},
	]


	// Context
	const connectionsQuery = useFarcasterConnections()
	const castsQuery = useLiveQuery(
		(q) =>
			q.from({ row: farcasterCastsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const usersQuery = useLiveQuery(
		(q) =>
			q.from({ row: farcasterUsersCollection }).select(({ row }) => ({ row })),
		[],
	)


	// (Derived)
	const defaultFilterIds = $derived(
		new Set(
			(connectionsQuery.data ?? []).map((r) =>
				String((r.row as { $id: { fid: number } }).$id.fid),
			),
		),
	)
	const allCasts = $derived(
		(castsQuery.data ?? []).map((r) => r.row) as FarcasterCastRow[],
	)
	const userByFid = $derived(
		new Map(
			(usersQuery.data ?? []).map((r) => [r.row.$id.fid, r.row as FarcasterUserRow]),
		),
	)
	const fidOptions = $derived(
		[
			...new Map(
				allCasts.map((c) => [
					c.$id.fid,
					userByFid.get(c.$id.fid)?.username ?? `@${c.$id.fid}`,
				]),
			).entries(),
		].sort((a, b) => a[1].localeCompare(b[1])),
	)
	const parentUrlOptions = $derived(
		[...new Set(allCasts.map((c) => c.parentUrl).filter(Boolean))].sort() as string[],
	)
	const fidFilters = $derived(
		fidOptions.map(([fid, label]) => ({
			id: String(fid),
			label,
			filterFunction: (cast: FarcasterCastRow) => (cast.$id.fid === fid),
		})),
	)
	const channelFilters = $derived(
		parentUrlOptions.map((url) => ({
			id: url,
			label: url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
			filterFunction: (cast: FarcasterCastRow) => (cast.parentUrl === url),
		})),
	)
	const filterGroups = $derived([
		...(fidFilters.length > 1 ?
			[farcasterComboboxFilterGroup('author', 'Author', fidFilters)]
		: []),
		...(channelFilters.length > 1 ?
			[farcasterComboboxFilterGroup('channel', 'Channel', channelFilters)]
		: []),
		farcasterComboboxFilterGroup('content', 'Content', contentFilters),
	])


	// Functions
	const replyCount = (cast: FarcasterCastRow) =>
		allCasts.filter(
			(c) =>
				c.parentFid === cast.$id.fid && c.parentHash === cast.$id.hash,
		).length
	const engagementScore = (c: FarcasterCastRow) =>
		(c.likeCount ?? 0) + (c.recastCount ?? 0) + replyCount(c)
	const trendingScore24h = (c: FarcasterCastRow) => {
		const ageHours = Math.max(0, (Date.now() / 1000 - c.timestamp) / 3600)
		const decay = 1 / (1 + ageHours / 12)
		return engagementScore(c) * decay
	}
	const viralityScore = (c: FarcasterCastRow) =>
		(c.recastCount ?? 0) * 2 + (c.likeCount ?? 0)


	// Actions
	$effect(() => {
		for (const c of allCasts) {
			ensureFarcasterUser(c.$id.fid).catch(() => {})
		}
	})


	// Components
	import FarcasterCast from '$/views/farcaster/FarcasterCast.svelte'
	import FarcasterFilteredEntityList from '$/views/farcaster/FarcasterFilteredEntityList.svelte'
</script>

<svelte:head>
	<title>Casts · Farcaster</title>
</svelte:head>

<main data-column="gap-4">
	<h1>Casts</h1>
	<FarcasterFilteredEntityList
		title="Casts"
		items={allCasts}
		isLoading={castsQuery.isLoading}
		{filterGroups}
		defaultFilterIds={defaultFilterIds}
		sortOptions={[
			{ id: 'newest', label: 'Newest first', compare: (a, b) => b.timestamp - a.timestamp },
			{ id: 'oldest', label: 'Oldest first', compare: (a, b) => a.timestamp - b.timestamp },
			{
				id: 'neynar-trending',
				label: 'Neynar trending (24h)',
				compare: (a, b) => trendingScore24h(b) - trendingScore24h(a),
			},
			{
				id: 'openrank-engagement',
				label: 'OpenRank engagement',
				compare: (a, b) => engagementScore(b) - engagementScore(a),
			},
			{
				id: 'virality',
				label: 'Virality (recasts)',
				compare: (a, b) => viralityScore(b) - viralityScore(a),
			},
			{
				id: 'replies-desc',
				label: 'Replies (high first)',
				compare: (a, b) => replyCount(b) - replyCount(a),
			},
			{
				id: 'likes-desc',
				label: 'Likes (high first)',
				compare: (a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0),
			},
			{
				id: 'recasts-desc',
				label: 'Recasts (high first)',
				compare: (a, b) => (b.recastCount ?? 0) - (a.recastCount ?? 0),
			},
		] as Sort<FarcasterCastRow, 'newest' | 'oldest' | 'neynar-trending' | 'openrank-engagement' | 'virality' | 'replies-desc' | 'likes-desc' | 'recasts-desc'>[]}
		defaultSortId="newest"
		getKey={(c) => `${c.$id.fid}:${c.$id.hash}`}
		filter={(c) => !c.parentFid || !c.parentHash}
		loadingMessage="Loading casts…"
		emptyMessage="No casts yet. Visit channels or users to load casts."
	>
		{#snippet Item({ item: cast })}
			<FarcasterCast {cast} {userByFid} />
		{/snippet}
	</FarcasterFilteredEntityList>
</main>
