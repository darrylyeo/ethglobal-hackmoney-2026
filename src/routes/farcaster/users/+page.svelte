<script lang="ts">
	// Types/constants
	import type { FarcasterUserRow } from '$/collections/FarcasterUsers.ts'
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
		(usersQuery.data ?? []).map(({ farcasterUser: user }) => user) as FarcasterUserRow[],
	)
	const usernameFilters = $derived(
		[...new Set(allUsers.map((u) => u.username ?? `fid:${u.$id.fid}`).filter(Boolean))]
			.sort()
			.map((username) => ({
				id: username,
				label: username.startsWith('fid:') ? username : `@${username}`,
				filterFunction: (user: FarcasterUserRow) =>
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
					filterFunction: (u: FarcasterUserRow) =>
						allLinks.some(
							(l) =>
								l.$id.sourceFid === connFid && l.$id.targetFid === u.$id.fid,
						),
				},
				{
					id: `following:${connFid}`,
					label: `Following ${label}`,
					filterFunction: (u: FarcasterUserRow) =>
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


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import FarcasterFilteredEntityList from '$/views/farcaster/FarcasterFilteredEntityList.svelte'
</script>


<svelte:head>
	<title>Users · Farcaster</title>
</svelte:head>

<main data-column="gap-4">
	<h1>Users</h1>
	<FarcasterFilteredEntityList
		title="Users"
		items={allUsers}
		isLoading={usersQuery.isLoading}
		{filterGroups}
		defaultFilterIds={defaultFilterIds}
		sortOptions={[
			{
				id: 'username-asc',
				label: 'Username A–Z',
				compare: (a, b) =>
					(a.username ?? String(a.$id.fid)).localeCompare(
						b.username ?? String(b.$id.fid),
					),
			},
			{
				id: 'username-desc',
				label: 'Username Z–A',
				compare: (a, b) =>
					(b.username ?? String(b.$id.fid)).localeCompare(
						a.username ?? String(a.$id.fid),
					),
			},
			{
				id: 'followers-desc',
				label: 'Followers (high first)',
				compare: (a, b) => followerCount(b.$id.fid) - followerCount(a.$id.fid),
			},
			{
				id: 'followers-asc',
				label: 'Followers (low first)',
				compare: (a, b) => followerCount(a.$id.fid) - followerCount(b.$id.fid),
			},
			{
				id: 'following-desc',
				label: 'Following (high first)',
				compare: (a, b) => followingCount(b.$id.fid) - followingCount(a.$id.fid),
			},
			{
				id: 'following-asc',
				label: 'Following (low first)',
				compare: (a, b) => followingCount(a.$id.fid) - followingCount(b.$id.fid),
			},
		] as Sort<FarcasterUserRow, 'username-asc' | 'username-desc' | 'followers-desc' | 'followers-asc' | 'following-desc' | 'following-asc'>[]}
		defaultSortId="username-asc"
		getKey={(u) => String(u.$id.fid)}
		emptyMessage="No users yet. Sign in with Farcaster or visit casts to load users."
	>
		{#snippet Item({ item: user })}
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
		{/snippet}
	</FarcasterFilteredEntityList>
</main>
