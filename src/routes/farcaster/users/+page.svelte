<script lang="ts">
	// Types/constants
	import type { WithSource } from '$/constants/data-sources.ts'
	import type { FarcasterUser } from '$/data/FarcasterUser.ts'
	import type { Sort } from '$/components/Sorts.svelte'
	import {
		ensureFollowersForUser,
		ensureFollowingForUser,
		farcasterLinksCollection,
	} from '$/collections/FarcasterLinks.ts'
	import { useFarcasterConnections } from '$/collections/FarcasterConnections.ts'
	import { farcasterUsersCollection } from '$/collections/FarcasterUsers.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { farcasterComboboxFilterGroup } from '$/lib/farcaster-filters.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'

	enum FarcasterUserSort {
		UsernameAsc = 'username-asc',
		UsernameDesc = 'username-desc',
		FollowersDesc = 'followers-desc',
		FollowersAsc = 'followers-asc',
		FollowingDesc = 'following-desc',
		FollowingAsc = 'following-asc',
	}

	// Context
	const connectionsQuery = useFarcasterConnections()
	const linksQuery = useLiveQuery(
		(q) => q.from({ link: farcasterLinksCollection }).select(({ link }) => ({ link })),
		[],
	)
	const usersQuery = useLiveQuery(
		(q) =>
			q.from({ farcasterUser: farcasterUsersCollection }).select(({ farcasterUser }) => ({ farcasterUser })),
		[],
	)


	// (Derived)
	const connections = $derived(
		(connectionsQuery.data ?? []).map(({ farcasterConnection: connection }) => connection as {
			$id: { fid: number }
			username?: string
		}),
	)
	const defaultFilterIds = $derived(
		new Set(connections.map((r) => r.username ?? `fid:${r.$id.fid}`)),
	)
	const allLinks = $derived(
		(linksQuery.data ?? []).map(({ link }) => link as { $id: { sourceFid: number; targetFid: number } }),
	)
	const allUsers = $derived(
		(usersQuery.data ?? []).map(({ farcasterUser: user }) => user) as WithSource<FarcasterUser>[],
	)
	const usernameFilters = $derived(
		[...new Set(allUsers.map((u) => u.username ?? `fid:${u.$id.fid}`).filter(Boolean))]
			.sort()
			.map((username) => ({
				id: username,
				label: username.startsWith('fid:') ? username : `@${username}`,
				filterFunction: (user: WithSource<FarcasterUser>) =>
					(user.username ?? `fid:${user.$id.fid}`) === username,
			})),
	)

	const connectionFilters = $derived(
		connections.flatMap((c) => {
			const label = c.username ? `@${c.username}` : `fid:${c.$id.fid}`
			const connFid = c.$id.fid
			return [
				{
					id: `followed-by:${connFid}`,
					label: `Followed by ${label}`,
					filterFunction: (u: WithSource<FarcasterUser>) =>
						allLinks.some(
							(l) =>
								l.$id.sourceFid === connFid && l.$id.targetFid === u.$id.fid,
						),
				},
				{
					id: `following:${connFid}`,
					label: `Following ${label}`,
					filterFunction: (u: WithSource<FarcasterUser>) =>
						allLinks.some(
							(l) =>
								l.$id.sourceFid === u.$id.fid && l.$id.targetFid === connFid,
						),
				},
			]
		}),
	)
	const filterGroups = $derived([
		...(usernameFilters.length > 1
			? [farcasterComboboxFilterGroup('username', 'Username', usernameFilters)]
			: []),
		...(connectionFilters.length > 0
			? [farcasterComboboxFilterGroup('connection', 'Connection', connectionFilters)]
			: []),
	])


	// Functions
	const followerCount = (fid: number) =>
		allLinks.filter((l) => l.$id.targetFid === fid).length
	const followingCount = (fid: number) =>
		allLinks.filter((l) => l.$id.sourceFid === fid).length


	// Actions
	$effect(() => {
		for (const c of connections) {
			ensureFollowingForUser(c.$id.fid).catch(() => {})
			ensureFollowersForUser(c.$id.fid).catch(() => {})
		}
	})


	// State (bound from RefinableItemsList)
	let displayCount = $state(0)

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import RefinableItemsList from '$/components/RefinableItemsList.svelte'
</script>


<svelte:head>
	<title>Users · Farcaster</title>
</svelte:head>

<main data-column="gap-4">
	<h1>Users</h1>
	<details data-card data-scroll-container="block" open>
		<summary>
			<h3 class="section-heading">Users ({displayCount})</h3>
		</summary>
		{#if allUsers.length === 0 && usersQuery.isLoading}
			<p data-text="muted">Loading…</p>
		{:else if allUsers.length === 0}
			<p data-text="muted">No users yet. Sign in with Farcaster or visit casts to load users.</p>
		{:else}
			<div data-column="gap-4">
				<RefinableItemsList
					items={allUsers}
					{filterGroups}
					defaultFilterIds={defaultFilterIds}
					sortOptions={[
						{
							id: FarcasterUserSort.UsernameAsc,
							label: 'Username A–Z',
							compare: (a, b) =>
								(a.username ?? String(a.$id.fid)).localeCompare(
									b.username ?? String(b.$id.fid),
								),
						},
						{
							id: FarcasterUserSort.UsernameDesc,
							label: 'Username Z–A',
							compare: (a, b) =>
								(b.username ?? String(b.$id.fid)).localeCompare(
									a.username ?? String(a.$id.fid),
								),
						},
						{
							id: FarcasterUserSort.FollowersDesc,
							label: 'Followers (high first)',
							compare: (a, b) => followerCount(b.$id.fid) - followerCount(a.$id.fid),
						},
						{
							id: FarcasterUserSort.FollowersAsc,
							label: 'Followers (low first)',
							compare: (a, b) => followerCount(a.$id.fid) - followerCount(b.$id.fid),
						},
						{
							id: FarcasterUserSort.FollowingDesc,
							label: 'Following (high first)',
							compare: (a, b) => followingCount(b.$id.fid) - followingCount(a.$id.fid),
						},
						{
							id: FarcasterUserSort.FollowingAsc,
							label: 'Following (low first)',
							compare: (a, b) => followingCount(a.$id.fid) - followingCount(b.$id.fid),
						},
					] as Sort<WithSource<FarcasterUser>, FarcasterUserSort>[]}
					defaultSortId={FarcasterUserSort.UsernameAsc}
					getKey={(u) => String(u.$id.fid)}
					bind:displayCount
					placeholderKeys={new Set<string>()}
				>
					{#snippet Empty()}
						<p data-text="muted">No users match filters.</p>
					{/snippet}
					{#snippet Item({ key: _key, item: row, isPlaceholder })}
						{#if !isPlaceholder && row != null}
							{@const user = row}
							<EntityView
								entityType={EntityType.FarcasterUser}
								entity={user}
								titleHref="/farcaster/user/{user.$id.fid}"
								label={user.username ? `@${user.username}` : `@${user.$id.fid}`}
								metadata={
									user.displayName ?
										[{ term: 'Display name', detail: user.displayName }]
									:	undefined
								}
							/>
						{/if}
					{/snippet}
				</RefinableItemsList>
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
