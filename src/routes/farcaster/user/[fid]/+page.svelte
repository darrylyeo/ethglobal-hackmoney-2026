<script lang="ts">
	// Types/constants
	import EntityView from '$/components/EntityView.svelte'
	import { EntityType } from '$/data/$EntityType.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'

	// Components
	import FarcasterCastsEntityList from '$/views/farcaster/FarcasterCastsEntityList.svelte'
	import FarcasterUserLinkList from '$/views/farcaster/FarcasterUserLinkList.svelte'

	// Context
	import { page } from '$app/state'


	// State
	import { farcasterCastsCollection } from '$/collections/FarcasterCasts.ts'
	import { farcasterLinksCollection } from '$/collections/FarcasterLinks.ts'
	import { farcasterUsersCollection } from '$/collections/FarcasterUsers.ts'
	import {
		ensureCastsByMention,
		ensureCastsForFid,
	} from '$/collections/FarcasterCasts.ts'
	import {
		ensureFollowersForUser,
		ensureFollowingForUser,
	} from '$/collections/FarcasterLinks.ts'
	import { ensureFarcasterUser } from '$/collections/FarcasterUsers.ts'
	import { LINK_TYPE_FOLLOW } from '$/api/farcaster/index.ts'
	import type { FarcasterCastRow } from '$/collections/FarcasterCasts.ts'


	// (Derived)
	const fidParam = $derived(page.params.fid ?? '')
	const fid = $derived(parseInt(fidParam, 10))

	let castsNextToken = $state<string | undefined>(undefined)
	let mentionsNextToken = $state<string | undefined>(undefined)
	let followersNextToken = $state<string | undefined>(undefined)
	let followingNextToken = $state<string | undefined>(undefined)
	let isLoadingMoreCasts = $state(false)
	let isLoadingMoreMentions = $state(false)
	let isLoadingMoreFollowers = $state(false)
	let isLoadingMoreFollowing = $state(false)
	$effect(() => {
		for (const m of mentions) {
			ensureFarcasterUser(m.$id.fid).catch(() => {})
		}
	})
	$effect(() => {
		for (const link of followers) {
			ensureFarcasterUser(link.$id.sourceFid).catch(() => {})
		}
	})
	$effect(() => {
		for (const link of following) {
			ensureFarcasterUser(link.$id.targetFid).catch(() => {})
		}
	})
	$effect(() => {
		if (fid > 0) {
			ensureFarcasterUser(fid).catch(() => {})
			ensureCastsForFid(fid)
				.then(({ nextPageToken }) => (castsNextToken = nextPageToken))
				.catch(() => {})
			ensureCastsByMention(fid)
				.then(({ nextPageToken }) => (mentionsNextToken = nextPageToken))
				.catch(() => {})
			ensureFollowersForUser(fid)
				.then(({ nextPageToken }) => (followersNextToken = nextPageToken))
				.catch(() => {})
			ensureFollowingForUser(fid)
				.then(({ nextPageToken }) => (followingNextToken = nextPageToken))
				.catch(() => {})
		} else {
			castsNextToken = undefined
			mentionsNextToken = undefined
			followersNextToken = undefined
			followingNextToken = undefined
		}
	})
	const loadMoreCasts = () => {
		if (!castsNextToken || isLoadingMoreCasts) return
		isLoadingMoreCasts = true
		ensureCastsForFid(fid, castsNextToken)
			.then(({ nextPageToken }) => (castsNextToken = nextPageToken))
			.catch(() => {})
			.finally(() => (isLoadingMoreCasts = false))
	}
	const loadMoreMentions = () => {
		if (!mentionsNextToken || isLoadingMoreMentions) return
		isLoadingMoreMentions = true
		ensureCastsByMention(fid, mentionsNextToken)
			.then(({ nextPageToken }) => (mentionsNextToken = nextPageToken))
			.catch(() => {})
			.finally(() => (isLoadingMoreMentions = false))
	}
	const loadMoreFollowers = () => {
		if (!followersNextToken || isLoadingMoreFollowers) return
		isLoadingMoreFollowers = true
		ensureFollowersForUser(fid, followersNextToken)
			.then(({ nextPageToken }) => (followersNextToken = nextPageToken))
			.catch(() => {})
			.finally(() => (isLoadingMoreFollowers = false))
	}
	const loadMoreFollowing = () => {
		if (!followingNextToken || isLoadingMoreFollowing) return
		isLoadingMoreFollowing = true
		ensureFollowingForUser(fid, followingNextToken)
			.then(({ nextPageToken }) => (followingNextToken = nextPageToken))
			.catch(() => {})
			.finally(() => (isLoadingMoreFollowing = false))
	}

	const userQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: farcasterUsersCollection })
				.where(({ row }) => eq(row.$id.fid, fid))
				.select(({ row }) => ({ row })),
		[() => [fid]],
	)
	const user = $derived(userQuery.data?.[0]?.row)
	const usersQuery = useLiveQuery(
		(q) =>
			q.from({ row: farcasterUsersCollection }).select(({ row }) => ({ row })),
		[],
	)
	const userByFid = $derived(
		new Map(
			(usersQuery.data ?? []).map((r) => [r.row.$id.fid, r.row]),
		),
	)
	const castsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: farcasterCastsCollection })
				.where(({ row }) => eq(row.$id.fid, fid))
				.select(({ row }) => ({ row })),
		[() => [fid]],
	)
	const allCastsQuery = useLiveQuery(
		(q) =>
			q.from({ row: farcasterCastsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const linksQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: farcasterLinksCollection })
				.where(({ row }) => eq(row.$id.linkType, LINK_TYPE_FOLLOW))
				.select(({ row }) => ({ row })),
		[],
	)
	const allCasts = $derived((castsQuery.data ?? []).map((r) => r.row as FarcasterCastRow))
	const allCastsFromDb = $derived(
		(allCastsQuery.data ?? []).map((r) => r.row as FarcasterCastRow),
	)
	const links = $derived(
		(linksQuery.data ?? []).map((r) => r.row as { $id: { sourceFid: number; targetFid: number; linkType: string } }),
	)
	const mentions = $derived(
		allCastsFromDb.filter((c) => c.mentions?.includes(fid)),
	)
	const followers = $derived(
		links.filter((l) => l.$id.targetFid === fid),
	)
	const following = $derived(
		links.filter((l) => l.$id.sourceFid === fid),
	)
	const rootCasts = $derived(
		allCasts.filter((c) => !c.parentFid || !c.parentHash),
	)
	const castsSet = $derived(new Set(rootCasts))
	const label = $derived(
		user?.username ? `@${user.username}` : user?.displayName ?? `User ${fid}`,
	)
</script>

<svelte:head>
	<title>{label} · Farcaster</title>
</svelte:head>

<main data-column="gap-4">
	{#if user || fid > 0}
		<EntityView
			entityType={EntityType.FarcasterUser}
			entity={user}
			idSerialized={String(fid)}
			href="/farcaster/user/{fid}"
			label={label}
			metadata={
				user?.bio || user?.verifiedAddress
					? [
							...(user?.bio ? [{ term: 'Bio', detail: user.bio }] : []),
							...(user?.verifiedAddress
								? [{ term: 'Verified', detail: user.verifiedAddress }]
								: []),
						]
					: undefined
			}
		>
			{#snippet children()}
				{#if user?.pfpUrl}
					<img src={user.pfpUrl} alt="" width="64" height="64" />
				{/if}
				<FarcasterCastsEntityList
					title="Casts"
					items={castsSet}
					loaded={castsSet.size}
					total={rootCasts.length > 0 ? rootCasts.length : undefined}
					{userByFid}
					pagination={{
						hasMore: !!castsNextToken,
						onLoadMore: loadMoreCasts,
						loading: isLoadingMoreCasts,
						label: 'Load more casts',
					}}
				/>
				{#if mentions.length > 0 || mentionsNextToken}
					<details>
						<summary>Mentions ({mentions.length})</summary>
						<FarcasterCastsEntityList
							title=""
							items={new Set(mentions)}
							loaded={mentions.length}
							total={mentions.length > 0 ? mentions.length : undefined}
							{userByFid}
							placeholderKeys={new Set()}
							placeholderText="Loading…"
							pagination={{
								hasMore: !!mentionsNextToken,
								onLoadMore: loadMoreMentions,
								loading: isLoadingMoreMentions,
								label: 'Load more mentions',
							}}
						/>
					</details>
				{/if}
				{#if followers.length > 0 || followersNextToken}
					<FarcasterUserLinkList
						title="Followers"
						links={followers}
						getFid={(l) => l.$id.sourceFid}
						{userByFid}
						hasMore={!!followersNextToken}
						onLoadMore={loadMoreFollowers}
						loading={isLoadingMoreFollowers}
						loadMoreLabel="Load more followers"
					/>
				{/if}
				{#if following.length > 0 || followingNextToken}
					<FarcasterUserLinkList
						title="Following"
						links={following}
						getFid={(l) => l.$id.targetFid}
						{userByFid}
						hasMore={!!followingNextToken}
						onLoadMore={loadMoreFollowing}
						loading={isLoadingMoreFollowing}
						loadMoreLabel="Load more following"
					/>
				{/if}
			{/snippet}
		</EntityView>
	{:else}
		<p>User not found: {fidParam}</p>
	{/if}
</main>
