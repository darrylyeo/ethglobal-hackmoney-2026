<script lang="ts">
	// Types/constants
	import type { WithSource } from '$/constants/data-sources.ts'
	import type { FarcasterCast } from '$/data/FarcasterCast.ts'
	import type { FarcasterUser } from '$/data/FarcasterUser.ts'
	import type { Sort } from '$/components/Sorts.svelte'
	import { farcasterCastsCollection } from '$/collections/FarcasterCasts.ts'
	import { useFarcasterConnections } from '$/collections/FarcasterConnections.ts'
	import { ensureFarcasterUser, farcasterUsersCollection } from '$/collections/FarcasterUsers.ts'
	import { farcasterComboboxFilterGroup } from '$/lib/farcaster-filters.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'

	enum FarcasterCastSort {
		Newest = 'newest',
		Oldest = 'oldest',
		NeynarTrending = 'neynar-trending',
		OpenrankEngagement = 'openrank-engagement',
		Virality = 'virality',
		RepliesDesc = 'replies-desc',
		LikesDesc = 'likes-desc',
		RecastsDesc = 'recasts-desc',
	}

	const contentFilters = [
		{
			id: 'has-embeds',
			label: 'Has embeds',
			filterFunction: (c: WithSource<FarcasterCast>) =>
				(c.embeds?.length ?? 0) > 0,
		},
		{
			id: 'has-quote',
			label: 'Has quote',
			filterFunction: (c: WithSource<FarcasterCast>) =>
				(c.embeds?.some((e) => e.castId) ?? false),
		},
		{
			id: 'has-url',
			label: 'Has URL embed',
			filterFunction: (c: WithSource<FarcasterCast>) =>
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
		)
	)
	const allCasts = $derived(
		(castsQuery.data ?? []).map(({ row: cast }) => cast) as WithSource<FarcasterCast>[]
	)
	const userByFid = $derived(
		new Map(
			(usersQuery.data ?? []).map(({ row: user }) => [user.$id.fid, user as WithSource<FarcasterUser>]),
		)
	)
	const fidOptions = $derived(
		[
			...new Map(
				allCasts.map((c) => [
					c.$id.fid,
					userByFid.get(c.$id.fid)?.username ?? `@${c.$id.fid}`,
				]),
			).entries(),
		].sort((a, b) => a[1].localeCompare(b[1]))
	)
	const parentUrlOptions = $derived(
		[...new Set(allCasts.map((c) => c.parentUrl).filter(Boolean))].sort() as string[]
	)
	const fidFilters = $derived(
		fidOptions.map(([fid, label]) => ({
			id: String(fid),
			label,
			filterFunction: (cast: WithSource<FarcasterCast>) => (cast.$id.fid === fid),
		}))
	)
	const channelFilters = $derived(
		parentUrlOptions.map((url) => ({
			id: url,
			label: url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
			filterFunction: (cast: WithSource<FarcasterCast>) => (cast.parentUrl === url),
		}))
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
	const replyCount = (cast: WithSource<FarcasterCast>) =>
		allCasts.filter(
			(c) =>
				c.parentFid === cast.$id.fid && c.parentHash === cast.$id.hash,
		).length
	const engagementScore = (c: WithSource<FarcasterCast>) =>
		(c.likeCount ?? 0) + (c.recastCount ?? 0) + replyCount(c)
	const trendingScore24h = (c: WithSource<FarcasterCast>) => {
		const ageHours = Math.max(0, (Date.now() - c.timestamp) / (3600 * 1000))
		const decay = 1 / (1 + ageHours / 12)
		return engagementScore(c) * decay
	}
	const viralityScore = (c: WithSource<FarcasterCast>) =>
		(c.recastCount ?? 0) * 2 + (c.likeCount ?? 0)


	// Actions
	$effect(() => {
		for (const c of allCasts) {
			ensureFarcasterUser(c.$id.fid).catch(() => {})
		}
	})


	// State (bound from RefinableList)
	let displayCount = $state(
		0
	)

	// Components
	import FarcasterCast from '$/views/farcaster/FarcasterCast.svelte'
	import RefinableList from '$/components/RefinableList.svelte'
</script>


<svelte:head>
	<title>Casts · Farcaster</title>
</svelte:head>


<main data-column="gap-4">
	<h1>
		Casts
	</h1>
	<details
		data-card
		data-scroll-container="block"
		open
	>
		<summary>
			<h3 class="section-heading">
				Casts ({displayCount})
			</h3>
		</summary>

		{#if allCasts.length === 0 && castsQuery.isLoading}
			<p data-text="muted">
				Loading casts…
			</p>
		{:else if allCasts.length === 0}
			<p data-text="muted">
				No casts yet. Visit channels or users to load casts.
			</p>
		{:else}
			<div data-column="gap-4">
				<RefinableList
					items={allCasts}
					{filterGroups}
					defaultFilterIds={defaultFilterIds}
					sortOptions={[
						{ id: FarcasterCastSort.Newest, label: 'Newest first', compare: (a, b) => b.timestamp - a.timestamp },
						{ id: FarcasterCastSort.Oldest, label: 'Oldest first', compare: (a, b) => a.timestamp - b.timestamp },
						{
							id: FarcasterCastSort.NeynarTrending,
							label: 'Neynar trending (24h)',
							compare: (a, b) => trendingScore24h(b) - trendingScore24h(a),
						},
						{
							id: FarcasterCastSort.OpenrankEngagement,
							label: 'OpenRank engagement',
							compare: (a, b) => engagementScore(b) - engagementScore(a),
						},
						{
							id: FarcasterCastSort.Virality,
							label: 'Virality (recasts)',
							compare: (a, b) => viralityScore(b) - viralityScore(a),
						},
						{
							id: FarcasterCastSort.RepliesDesc,
							label: 'Replies (high first)',
							compare: (a, b) => replyCount(b) - replyCount(a),
						},
						{
							id: FarcasterCastSort.LikesDesc,
							label: 'Likes (high first)',
							compare: (a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0),
						},
						{
							id: FarcasterCastSort.RecastsDesc,
							label: 'Recasts (high first)',
							compare: (a, b) => (b.recastCount ?? 0) - (a.recastCount ?? 0),
						},
					] as Sort<WithSource<FarcasterCast>, FarcasterCastSort>[]}
					defaultSortId={FarcasterCastSort.Newest}
					getKey={(c) => `${c.$id.fid}:${c.$id.hash}`}
					filter={(c) => !c.parentFid || !c.parentHash}
					bind:displayCount
					placeholderKeys={new Set<string>()}
				>
					{#snippet Empty()}
						<p data-text="muted">
							No casts match filters.
						</p>
					{/snippet}

					{#snippet Item({ key: _key, item: row, isPlaceholder })}
						{#if !isPlaceholder && row != null}
							{@const cast = row}

							<FarcasterCast {cast} {userByFid} />
						{/if}
					{/snippet}
				</RefinableList>
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
